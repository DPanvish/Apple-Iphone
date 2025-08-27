import { PerspectiveCamera, View } from "@react-three/drei"
import Lights from "./Lights"
import IPhone from "./IPhone"
import { Suspense } from "react"


const ModelView = ({index, groupRef, gsapType, controlRef, setRotationSize, size, item}) => {
  

  return (
    <View 
      index={index}
      id={gsapType}
      className={`border-2 border-red-500 w-full h-full ${index === 2} ? right-[-100%] : ""`}
    >
      {/* Ambient Light */}
      <ambientLight intensity={0.3} />

      {/* Perspective Canera similar to human eye */}
      <PerspectiveCamera makeDefault position={[0, 0, 4]} />

      {/* Lights for lighting the scene */}
      <Lights />

      {/* Suspense for loading model */}
      <Suspense fallback={<div>Loading...</div>}>
        <IPhone />
      </Suspense>
    </View>
  )
}

export default ModelView