'use client'

import { useEffect, useState } from 'react'
import { AvatarScene } from '@/components/avatar3d/AvatarScene'
import { useContinuousConversation } from '@/hooks/use-continuous-conversation'
import { StatusIndicator } from '@/components/ui/status-indicator'
import type { PersonalityId } from '@/lib/personalities'

/**
 * AVATARES 3D REMOTOS (READY PLAYER ME)
 * ❌ NO usamos /public
 * ❌ NO usamos rutas locales
 */
const rpmUrl = (id: string) =>
  `https://models.readyplayer.me/${id}.glb?morphTargets=ARKit,Oculus%20Visemes`

const AVATAR_MODELS = {
  alegre: rpmUrl('698238c1fcad0d2f33ea665c'),
  empatico: rpmUrl('69823b9c7091d5aa567556b2'),
  intenso: rpmUrl('698233b037816994171a6669'),
}

const PERSONALITY_BY_AVATAR: Record<keyof typeof AVATAR_MODELS, PersonalityId> = {
  alegre: 'alegra',
  empatico: 'empatico',
  intenso: 'intenso',
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
  const [roomAvatarId, setRoomAvatarId] =
    useState<keyof typeof AVATAR_MODELS | null>(null)
  const [hasStartedOnce, setHasStartedOnce] = useState(false)

  const personalityId =
    roomAvatarId ? PERSONALITY_BY_AVATAR[roomAvatarId] : 'alegra'
  const {
    state,
    error,
    audioEnergy,
    isSupported,
    isPaused,
    interimTranscript,
    start,
    pause,
    resume,
    resetConversation,
  } = useContinuousConversation({
    personalityId,
    silenceTimeout: 1200,
  })

  useEffect(() => {
    pause()
    resetConversation()
    setHasStartedOnce(false)
  }, [personalityId, pause, resetConversation])

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Fondo */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-background/95" />

      {/* UI */}
      <div className="relative z-10 flex flex-col items-center gap-8 pt-20 md:pt-28">
        {roomAvatarId ? (
          <div className="flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => {
                pause()
                resetConversation()
                setHasStartedOnce(false)
                setRoomAvatarId(null)
              }}
              className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white"
            >
              Volver al selector
            </button>

            <AvatarScene
              modelUrl={AVATAR_MODELS[roomAvatarId]}
              conversationState={state}
              audioEnergy={audioEnergy}
              frameYOffset={AVATAR_FRAME.yOffset}
              desiredHeadY={AVATAR_FRAME.desiredHeadY}
              targetHeight={AVATAR_FRAME.targetHeight}
              sizeMultiplier={AVATAR_FRAME.sizeMultiplier}
              cameraY={AVATAR_FRAME.cameraY}
              cameraTargetY={AVATAR_FRAME.cameraTargetY}
              cameraZ={AVATAR_FRAME.cameraZ}
            />

            <p className="text-sm capitalize text-white/70">
              habitacion de {roomAvatarId}
            </p>

            <div className="flex flex-col items-center gap-3">
              <StatusIndicator state={state} error={error} />

              {interimTranscript ? (
                <p className="max-w-xl text-center text-sm text-white/70">
                  "{interimTranscript}"
                </p>
              ) : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!hasStartedOnce) {
                      resetConversation()
                      await start()
                      setHasStartedOnce(true)
                      return
                    }
                    if (isPaused) {
                      await resume()
                    } else {
                      pause()
                    }
                  }}
                  disabled={!isSupported}
                  className="rounded-md bg-white/90 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
                >
                  {!hasStartedOnce ? 'Iniciar' : isPaused ? 'Seguir' : 'Pausar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 px-8 md:grid-cols-3 md:gap-16">
            {(Object.entries(AVATAR_MODELS) as Array<[keyof typeof AVATAR_MODELS, string]>).map(
              ([id, modelUrl]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRoomAvatarId(id)}
                  className="flex flex-col items-center gap-2"
                >
                  <AvatarScene
                    modelUrl={modelUrl}
                    conversationState="idle"
                    audioEnergy={0}
                    frameYOffset={AVATAR_FRAME.yOffset}
                    desiredHeadY={AVATAR_FRAME.desiredHeadY}
                    targetHeight={AVATAR_FRAME.targetHeight}
                    sizeMultiplier={AVATAR_FRAME.sizeMultiplier}
                    cameraY={AVATAR_FRAME.cameraY}
                    cameraTargetY={AVATAR_FRAME.cameraTargetY}
                    cameraZ={AVATAR_FRAME.cameraZ}
                  />
                  <p className="text-sm capitalize text-white/70">{id}</p>
                </button>
              )
            )}
          </div>
        )}
      </div>
    </main>
  )
}
