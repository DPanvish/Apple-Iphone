export const animateWithGsapTimeline = (timeline, rotationRef, rotationState, firstTarget, secondTarget, animationProps) => {
    timeline.to(rotationRef.current.rotation, {
        y: rotationState,
        duration: 1,
        ease: "power2.inOut",
    });

    // < symbol specifies that the animation should start at the same time as the previous one.
    timeline.to(firstTarget, {
        ...animationProps,
        ease: "power2.inOut"
    }, '<');

    timeline.to(secondTarget, {
        ...animationProps,
        ease: "power2.inOut"
    }, '<')
}