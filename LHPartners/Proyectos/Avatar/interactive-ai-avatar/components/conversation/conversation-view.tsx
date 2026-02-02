'use client'

import { useState, useCallback } from 'react'
import { AvatarCanvas } from '@/components/avatar/avatar-canvas'
import { AvatarSelector } from '@/components/avatar/avatar-selector'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { useContinuousConversation } from '@/hooks/use-continuous-conversation'
import { DEFAULT_AVATAR } from '@/lib/avatar-config'
import type { AvatarConfig } from '@/types/avatar'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Square } from 'lucide-react'

export function ConversationView() {
  const [selectedAvatar, setSelectedAvatar] =
    useState<AvatarConfig>(DEFAULT_AVATAR)
  const [showSelector, setShowSelector] = useState(true)

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
    stopSpeaking,
    resetConversation,
  } = useContinuousConversation({
    avatar: selectedAvatar,
    personalityId: selectedAvatar.id,
    silenceTimeout: 1800,
  })

  const handleAvatarSelect = useCallback(
    (avatar: AvatarConfig) => {
      resetConversation()
      setSelectedAvatar(avatar)
      setShowSelector(false)
    },
    [resetConversation]
  )

  const handleBackToSelector = useCallback(() => {
    pause()
    setShowSelector(true)
  }, [pause])

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <header className="flex items-center justify-between w-full max-w-2xl">
        {showSelector ? (
          <h1 className="text-xl font-semibold">Avatar IA</h1>
        ) : (
          <button onClick={handleBackToSelector}>Cambiar avatar</button>
        )}
        {!showSelector && <StatusIndicator state={state} error={error} />}
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full">
        {showSelector ? (
          <AvatarSelector
            selectedId={selectedAvatar.id}
            onSelect={handleAvatarSelect}
          />
        ) : (
          <>
            <AvatarCanvas
              avatar={selectedAvatar}
              conversationState={state}
              audioEnergy={audioEnergy}
            />

            {interimTranscript && (
              <p className="italic text-sm mt-4">
                “{interimTranscript}”
              </p>
            )}
          </>
        )}
      </main>

      {!showSelector && (
        <footer className={cn('flex gap-4', isPaused && 'opacity-50')}>
          {state === 'speaking' ? (
            <button onClick={stopSpeaking}>
              <Square />
            </button>
          ) : isPaused ? (
            <button onClick={start} disabled={!isSupported}>
              <Mic />
            </button>
          ) : (
            <button onClick={pause}>
              <MicOff />
            </button>
          )}
        </footer>
      )}
    </div>
  )
}
