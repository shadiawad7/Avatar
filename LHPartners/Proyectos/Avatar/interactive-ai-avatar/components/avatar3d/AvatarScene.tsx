'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { Avatar3D } from './Avatar3D'
import type { ConversationState } from '@/types/conversation'

type Props = {
  modelUrl: string
  conversationState: ConversationState
  frameYOffset?: number
  desiredHeadY?: number
  targetHeight?: number
  sizeMultiplier?: number
  cameraY?: number
  cameraTargetY?: number
  cameraZ?: number
}

export function AvatarScene({
  modelUrl,
  conversationState,
  frameYOffset = 0,
  desiredHeadY = 1.28,
  targetHeight = 1.55,
  sizeMultiplier = 1,
  cameraY = 1.46,
  cameraTargetY = 1.32,
  cameraZ = 1.22,
}: Props) {
  return (
    <div className="w-[220px] h-[280px] overflow-visible">
      <Canvas
        shadows
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
        camera={{
          position: [0, cameraY, cameraZ],
          fov: 30,
        }}
      >
        <ambientLight intensity={0.22} />
        <hemisphereLight
          intensity={0.55}
          color="#f1f5ff"
          groundColor="#2f384a"
        />
        <directionalLight
          position={[1.2, 1.9, 1.4]}
          intensity={1.35}
          color="#fff4dd"
          castShadow
        />
        <directionalLight
          position={[-1.5, 1.5, 0.8]}
          intensity={0.55}
          color="#cfe2ff"
        />
        <directionalLight
          position={[0, 1.9, -1.8]}
          intensity={0.35}
          color="#b8d1ff"
        />

        <Suspense fallback={null}>
          <Avatar3D
            modelUrl={modelUrl}
            conversationState={conversationState}
            frameYOffset={frameYOffset}
            desiredHeadY={desiredHeadY}
            targetHeight={targetHeight}
            sizeMultiplier={sizeMultiplier}
          />
          <Environment preset="studio" />
        </Suspense>

        <OrbitControls
          target={[0, cameraTargetY, 0]}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </div>
  )
}
