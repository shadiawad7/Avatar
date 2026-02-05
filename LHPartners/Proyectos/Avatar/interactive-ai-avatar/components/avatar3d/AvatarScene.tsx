'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Suspense } from 'react'
import { Avatar3D } from './Avatar3D'
import type { ConversationState } from '@/types/conversation'

type Props = {
  modelUrl: string
  conversationState: ConversationState
  audioEnergy?: number
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
  audioEnergy = 0,
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
        gl={{
          alpha: true,
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.85,
        }}
        style={{ background: 'transparent' }}
        camera={{
          position: [0, cameraY, cameraZ],
          fov: 30,
        }}
      >
        <ambientLight intensity={0.12} />
        <hemisphereLight
          intensity={0.22}
          color="#f1f5ff"
          groundColor="#2f384a"
        />
        <directionalLight
          position={[1.2, 1.9, 1.4]}
          intensity={0.55}
          color="#fff4dd"
        />
        <directionalLight
          position={[-1.5, 1.5, 0.8]}
          intensity={0.2}
          color="#cfe2ff"
        />
        <directionalLight
          position={[0, 1.9, -1.8]}
          intensity={0.18}
          color="#b8d1ff"
        />

        <Suspense fallback={null}>
          <Avatar3D
            modelUrl={modelUrl}
            conversationState={conversationState}
            audioEnergy={audioEnergy}
            frameYOffset={frameYOffset}
            desiredHeadY={desiredHeadY}
            targetHeight={targetHeight}
            sizeMultiplier={sizeMultiplier}
          />
          <Environment preset="studio" environmentIntensity={0.6} />
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
