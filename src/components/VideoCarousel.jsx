// GSAP core
import gsap from "gsap";
// React-friendly GSAP hook for lifecycle-safe animations
import { useGSAP } from "@gsap/react";
// ScrollTrigger lets us react to viewport visibility
import { ScrollTrigger } from "gsap/all";
// Register plugin once
gsap.registerPlugin(ScrollTrigger);

import { useEffect, useRef, useState } from "react";

// App data: text and video sources for each slide
import { highlightsSlides } from "../constants"
// Control button icons
import { pauseImg, playImg, replayImg } from "../utils";

const VideoCarousel = () => {
  // Ref to the horizontal strip that translates left/right between slides
  const sliderRef = useRef(null);
  // Ref to the visible area used for scroll-based play/pause
  const containerRef = useRef(null);
  // Refs to each <video> element to control playback and read currentTime
  const videoRef = useRef([]);
  // Refs for inner fill bars inside each indicator dot
  const videoSpanRef = useRef([]);
  // Refs for outer indicator dots that expand while playing
  const videoDivRef = useRef([]);

  // Global video UI state
  const [video, setVideo] = useState({
    // Has the current video reached the end?
    isEnd: false,
    // First-time start flag so we don't auto-play until section is visible
    startPlay: false,
    // Index of the active video/slide
    videoId: 0,
    // Are we at the last video in the list?
    isLastVideo: false,
    // Global play/pause state managed by scroll and controls
    isPlaying: false,
  });

  // Track when metadata is loaded so durations are available
  const [loadedData, setLoadedData] = useState([]);
  const { isEnd, isLastVideo, startPlay, videoId, isPlaying } = video;
  // Keep around a previous id if ever needed (reserved for future use)
  const prevVideoIdRef = useRef(videoId);
  // True while the strip is animating between slides (prevents early play)
  const [isSliding, setIsSliding] = useState(false);

  // Animate: slide transition and viewport-controlled play/pause
  useGSAP(() => {
    // 1) Slide the entire strip by 100% per index (smooth horizontal carousel)
    if (sliderRef.current) {
      setIsSliding(true);
      gsap.to(sliderRef.current, {
        // Move by -100% for each step to bring the next slide into view
        xPercent: -100 * videoId,
        duration: 1.2,
        ease: "power2.inOut",
        // Mark sliding complete to allow autoset play logic to resume
        onComplete: () => setIsSliding(false),
      });
    }

    // 2) Start/pause based on viewport using ScrollTrigger
    //    - enter: mark allowed to start and set playing
    //    - leave: pause to ensure no offscreen playback
    if (containerRef.current) {
      gsap.to(containerRef.current, {
        scrollTrigger: {
          trigger: containerRef.current,
          // Thresholds so the section is mostly on-screen before playing
          start: "top 75%",
          end: "bottom 25%",
          onEnter: () => setVideo((pre) => ({ ...pre, startPlay: true, isPlaying: true })),
          onEnterBack: () => setVideo((pre) => ({ ...pre, isPlaying: true })),
          onLeave: () => setVideo((pre) => ({ ...pre, isPlaying: false })),
          onLeaveBack: () => setVideo((pre) => ({ ...pre, isPlaying: false })),
        },
      });
    }
  }, [isEnd, videoId]);

  // Progress indicators: fill current, reset others, and shrink to dot after complete
  useEffect(() => {
    let currentProgress = 0;
    const spans = videoSpanRef.current || [];
    const dots = videoDivRef.current || [];

    // Reset all indicators to initial state (small dot, gray, 0% fill)
    dots.forEach((dot, idx) => {
      if (!dot) return;
      gsap.set(dot, { width: "12px" });
      if (spans[idx]) gsap.set(spans[idx], { width: 0, backgroundColor: "#afafaf" });
    });

    // Setup the active indicator animation when a valid video is selected
    if (spans[videoId] && videoRef.current[videoId]) {
      // Active indicator starts white and empty before filling
      gsap.set(spans[videoId], { width: 0, backgroundColor: "white" });

      // This GSAP tween’s progress is driven by the video’s playback time
      const anim = gsap.to(spans[videoId], {
        onUpdate: () => {
          // Sync our fill % with the tween progress
          const progress = Math.ceil(anim.progress() * 100);
          if (progress !== currentProgress) {
            currentProgress = progress;

            // While playing, expand the dot to a small bar (responsive widths)
            gsap.to(dots[videoId], {
              width:
                window.innerWidth < 760
                  ? "10vw" // mobile
                  : window.innerWidth < 1200
                  ? "10vw" // tablet
                  : "4vw", // desktop
              duration: 0.2,
            });

            // Fill the inner bar visually to match the current progress
            gsap.to(spans[videoId], {
              width: `${currentProgress}%`,
              backgroundColor: "white",
              duration: 0.2,
            });
          }
        },
        onComplete: () => {
          // When a video completes, collapse back to a dot and gray out
          gsap.to(dots[videoId], { width: "12px", duration: 0.2 });
          gsap.to(spans[videoId], { backgroundColor: "#afafaf", duration: 0.2 });
        },
      });

      // Always start fill from 0% for a new active video
      anim.progress(0);

      // Drive the tween progress from video playback time (0..1)
      const animUpdate = () => {
        const vid = videoRef.current[videoId];
        if (!vid) return;
        // Prefer provided duration from data, fallback to actual video duration
        const total = highlightsSlides[videoId]?.duration || vid.duration || 1;
        anim.progress(vid.currentTime / total);
      };

      // Only tick while globally marked as playing
      if (isPlaying) {
        gsap.ticker.add(animUpdate);
      }

      // Cleanup: stop ticking when deps change or component unmounts
      return () => {
        gsap.ticker.remove(animUpdate);
      };
    }
  }, [videoId, startPlay, isPlaying]);

  // Control actual video playback respecting: metadata loaded, visibility, sliding
  useEffect(() => {
    if (loadedData.length > 3) {
      const vid = videoRef.current[videoId];
      if (!vid) return;

      // Pause if not allowed to play yet or while the carousel is sliding
      if (!isPlaying || isSliding) {
        vid.pause();
      } else if (startPlay && !isSliding) {
        // Start/resume playback safely (catch prevents console noise on blocked play)
        vid.play().catch(() => {});
      }
    }
  }, [startPlay, videoId, isPlaying, loadedData, isSliding]);

  // Centralized handler for carousel and playback state transitions
  const handleProcess = (type, i) => {
    switch (type) {
      case "video-end":
        // Move to next video when current ends
        setVideo((pre) => ({ ...pre, isEnd: true, videoId: i + 1 }));
        break;

      case "video-last":
        // Mark the end of the list (enables replay icon)
        setVideo((pre) => ({ ...pre, isLastVideo: true }));
        break;

      case "video-reset":
        // Jump back to the start
        setVideo((pre) => ({ ...pre, videoId: 0, isLastVideo: false }));
        break;

      case "pause":
        // Toggle play/pause from the control button
        setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
        break;

      case "play":
        // Toggle play/pause from the control button
        setVideo((pre) => ({ ...pre, isPlaying: !pre.isPlaying }));
        break;

      default:
        return video;
    }
  };

  // Mark when each video’s metadata is available (duration, dimensions, etc.)
  const handleLoadedMetaData = (i, e) => setLoadedData((pre) => [...pre, e]);

  return (
    <>
      {/* Visible area that controls when we auto-play via ScrollTrigger */}
      <div className="flex items-center overflow-hidden" ref={containerRef}>
        {/* Horizontal strip that slides left/right between videos */}
        <div className="flex" ref={sliderRef}>
          {highlightsSlides.map((list, i) => (
            <div key={list.id} className="sm:pr-20 pr-10 shrink-0 w-full">
              <div className="video-carousel_container">
                {/* Masked video area */}
                <div className="w-full h-full flex-center rounded-3xl overflow-hidden bg-black">
                  <video
                    // Prevents full-screen on iOS during inline playback
                    playsInline={true}
                    className={`${
                      list.id === 2 && "translate-x-44"
                    } pointer-events-none`}
                    preload="auto"
                    muted
                    ref={(el) => (videoRef.current[i] = el)}
                    onEnded={() =>
                      i !== 3
                        ? handleProcess("video-end", i)
                        : handleProcess("video-last")
                    }
                    onPlay={() =>
                      setVideo((pre) => ({ ...pre, isPlaying: true }))
                    }
                    onLoadedMetadata={(e) => handleLoadedMetaData(i, e)}
                  >
                    <source src={list.video} type="video/mp4" />
                  </video>
                </div>

                {/* Slide text overlay */}
                <div className="absolute top-12 left-[5%] z-10">
                  {list.textLists.map((text, idx) => (
                    <p key={idx} className="md:text-2xl text-xl font-medium">
                      {text}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress indicators and control button */}
      <div className="relative flex-center mt-10">
        {/* Indicator row */}
        <div className="flex-center py-5 px-7 bg-gray-300 backdrop-blur rounded-full">
          {highlightsSlides.map((_, i) => (
            <span
              key={i}
              className="mx-2 w-3 h-3 bg-gray-200 rounded-full relative cursor-pointer overflow-hidden"
              ref={(el) => (videoDivRef.current[i] = el)}
            >
              {/* Inner fill bar that grows from 0% to 100% */}
              <span
                className="absolute left-0 top-0 h-full w-0 rounded-full"
                ref={(el) => (videoSpanRef.current[i] = el)}
              />
            </span>
          ))}
        </div>

        {/* Play/Pause/Replay control button */}
        <button className="control-btn">
          <img
            src={isLastVideo ? replayImg : !isPlaying ? playImg : pauseImg}
            alt={isLastVideo ? "replay" : !isPlaying ? "play" : "pause"}
            onClick={
              isLastVideo
                ? () => handleProcess("video-reset")
                : !isPlaying
                ? () => handleProcess("play")
                : () => handleProcess("pause")
            }
          />
        </button>
      </div>
    </>
  );
};

export default VideoCarousel;