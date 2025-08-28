import { Html, OrbitControls, PerspectiveCamera, View } from "@react-three/drei"
import Lights from "./Lights"
import IPhone from "./IPhone"
import { Suspense } from "react"
import * as THREE from "three"
import LoadingModel from "./LoadingModel"


const ModelView = ({index, groupRef, gsapType, controlRef, setRotationState, size, item}) => {
  

  return (
    <View 
      index={index}
      id={gsapType}
      className={`w-full h-full ${index === 2} ? right-[-100%] : ""`}
    >
      {/* Ambient Light */}
      <ambientLight intensity={0.3} />

      {/* Perspective Canera similar to human eye */}
      <PerspectiveCamera makeDefault position={[0, 0, 4]} />

      {/* Lights for lighting the scene */}
      <Lights />

      {/* 
        Group Ref is used to rotate the phone 
        and it's children elements.
        It also has a name which is used to identify the group.
        Based on name we can set either samll or large model
      */}
      <group ref={groupRef} name={`${index === 1} ? small : large`} position={[0, 0, 0]}>
        {/* Suspense is used to load the model asynchronously */}
        <Suspense fallback={<LoadingModel duration={3} />}> {/* increase to 3s per loop; adjust as needed */}

          {/* Controls for rotating and zooming in/out of the scene (only after model loads) */}
          <OrbitControls 
            makeDefault
            ref={controlRef}
            enableZoom={false}
            enablePan={false}
            rotateSpeed={0.4}
            target={new THREE.Vector3(0, 0, 0)}
            onEnd={() => setRotationState(controlRef.current.getAzimuthalAngle())}
          />

          <IPhone 
            scale={index === 1 ? [15, 15, 15] : [17, 17, 17]}
            item={item}
            size={size}
          />
        </Suspense>
      </group>
    </View>
  )
}

export default ModelView