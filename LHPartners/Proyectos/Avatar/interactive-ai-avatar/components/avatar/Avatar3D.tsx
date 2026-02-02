"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { AVATARS_3D } from "@/lib/avatar-3d-config"

type Props = {
  avatarId: string
}

function HumanModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl)

  return (
    <primitive
      object={scene}
      scale={1.6}
      position={[0, 0, 0]}   // 🔴 NO movemos el modelo
    />
  )
}

export default function Avatar3D({ avatarId }: Props) {
  const avatar =
    AVATARS_3D.find((a) => a.id === avatarId) ?? AVATARS_3D[0]

  return (
    <div style={{ width: "100%", height: "420px" }}>
      <Canvas camera={{ position: [0, 1.6, 4], fov: 40 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[3, 6, 3]} intensity={1.2} />

        <HumanModel modelUrl={avatar.modelUrl} />

        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  )
}
