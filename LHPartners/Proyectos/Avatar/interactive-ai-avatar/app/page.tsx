'use client'

import { useState } from 'react'
import { ConversationView } from '@/components/conversation/conversation-view'
import { AvatarScene } from '@/components/avatar3d/AvatarScene'
import type { ConversationState } from '@/types/conversation'

/**
 * AVATARES 3D REMOTOS (READY PLAYER ME)
 * ❌ NO usamos /public
 * ❌ NO usamos rutas locales
 */
const rpmUrl = (id: string) =>
  `https://models.readyplayer.me/${id}.glb?morphTargets=ARKit,Oculus%20Visemes`

const AVATAR_MODELS = {
  alegre: rpmUrl('697cf1f3fcad0d2f33be22f2'),
  empatico: rpmUrl('697d0b5a69acda1daa75a3d6'),
  intenso: rpmUrl('697d0c6169acda1daa75adde'),
}

// Controles manuales de encuadre 3D (ajusta estos numeros a tu gusto).
const AVATAR_FRAME = {
  yOffset: 2.4,        // mayor valor => avatar mas abajo
  desiredHeadY: 1.28,  // sube/baja la referencia de la cabeza
  targetHeight: 1.82,  // base de altura normalizada
  sizeMultiplier: 1.75, // mayor valor => avatar claramente mas grande
  cameraY: 1.72,       // mayor valor => camara mas alta
  cameraTargetY: 1.62, // mayor valor => mirada mas arriba
  cameraZ: 0.98,       // menor valor => zoom in (se ve mas grande)
}

export default function Home() {
  const [selectedAvatarId, setSelectedAvatarId] =
    useState<keyof typeof AVATAR_MODELS | null>(null)

  // 🔧 temporal para probar expresiones
  const [conversationState] =
    useState<ConversationState>('speaking')

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95" />

      {/* UI */}
      <div className="relative z-10 flex flex-col items-center gap-8 pt-20 md:pt-28">
        {/* 3 avatares 3D */}
        <div className="grid grid-cols-1 gap-10 px-8 md:grid-cols-3 md:gap-16">
          {(Object.entries(AVATAR_MODELS) as Array<[keyof typeof AVATAR_MODELS, string]>).map(
            ([id, modelUrl]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedAvatarId(id)}
                className="flex flex-col items-center gap-2"
              >
                <AvatarScene
                  modelUrl={modelUrl}
                  conversationState={selectedAvatarId === id ? conversationState : 'idle'}
                  frameYOffset={AVATAR_FRAME.yOffset}
                  desiredHeadY={AVATAR_FRAME.desiredHeadY}
                  targetHeight={AVATAR_FRAME.targetHeight}
                  sizeMultiplier={AVATAR_FRAME.sizeMultiplier}
                  cameraY={AVATAR_FRAME.cameraY}
                  cameraTargetY={AVATAR_FRAME.cameraTargetY}
                  cameraZ={AVATAR_FRAME.cameraZ}
                />
                <p className="text-sm capitalize text-white/70">
                  {id}
                  {selectedAvatarId === id ? ' ✓' : ''}
                </p>
              </button>
            )
          )}
        </div>

        {/* Conversación */}
        <ConversationView />
      </div>
    </main>
  )
}
