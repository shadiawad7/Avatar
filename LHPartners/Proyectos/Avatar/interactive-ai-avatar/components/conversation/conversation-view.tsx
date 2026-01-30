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

/**
 * Main conversation view component
 * Supports continuous voice conversation without button presses
 * User just speaks naturally, and the avatar responds after detecting silence
 */
export function ConversationView() {
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR)
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
    silenceTimeout: 1800, // 1.8 seconds of silence before processing
  })

  const handleAvatarSelect = useCallback((avatar: AvatarConfig) => {
    // Reset conversation when changing avatar
    resetConversation()
    setSelectedAvatar(avatar)
    setShowSelector(false)
  }, [resetConversation])

  const handleBackToSelector = useCallback(() => {
    pause() // Pause when going back
    setShowSelector(true)
  }, [pause])

  // Start conversation when entering conversation mode
  const handleStartConversation = useCallback(async () => {
    await start()
  }, [start])

  // Toggle pause/resume
  const handleTogglePause = useCallback(async () => {
    if (isPaused) {
      await resume()
    } else {
      pause()
    }
  }, [isPaused, pause, resume])

  // Handle stopping speech
  const handleStopSpeaking = useCallback(() => {
    stopSpeaking()
  }, [stopSpeaking])

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 md:p-10 bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="flex items-center justify-between w-full max-w-2xl">
        {showSelector ? (
          <h1 className="text-xl font-semibold text-foreground/90">Avatar IA</h1>
        ) : (
          <button
            onClick={handleBackToSelector}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Cambiar avatar</span>
          </button>
        )}
        {!showSelector && <StatusIndicator state={state} error={error} />}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl py-8">
        {showSelector ? (
          <div className="animate-in fade-in duration-500">
            <AvatarSelector
              selectedId={selectedAvatar.id}
              onSelect={handleAvatarSelect}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Avatar display */}
            <div className="relative">
              <AvatarCanvas
                avatar={selectedAvatar}
                conversationState={state}
                audioEnergy={audioEnergy}
              />
              
              {/* Avatar name */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedAvatar.name}
                </span>
              </div>
            </div>

            {/* Live transcript display */}
            <div className="min-h-[60px] flex items-center justify-center">
              {(state === 'listening' || state === 'thinking') && interimTranscript && (
                <div className="px-5 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 max-w-md text-center animate-in fade-in duration-200">
                  <p className="text-sm text-foreground/80 italic">&quot;{interimTranscript}&quot;</p>
                </div>
              )}
              {state === 'thinking' && !interimTranscript && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-sm">Pensando...</span>
                </div>
              )}
            </div>

            {/* Audio support warning */}
            {!isSupported && (
              <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center max-w-sm">
                Tu navegador no soporta grabacion de audio. 
                Por favor usa un navegador moderno como Chrome o Edge.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer with controls */}
      <footer
        className={cn(
          'flex flex-col items-center gap-6 transition-all duration-500',
          showSelector ? 'opacity-0 pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'
        )}
      >
        {/* Control buttons */}
        <div className="flex items-center gap-4">
          {/* Stop speaking button (only when avatar is speaking) */}
          {state === 'speaking' && (
            <button
              onClick={handleStopSpeaking}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-full',
                'bg-destructive/90 hover:bg-destructive text-destructive-foreground',
                'transition-all duration-200 shadow-lg hover:shadow-xl',
                'animate-in fade-in zoom-in-95 duration-200'
              )}
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">Detener</span>
            </button>
          )}

          {/* Main pause/resume button */}
          {state !== 'speaking' && (
            <>
              {isPaused ? (
                <button
                  onClick={handleStartConversation}
                  disabled={!isSupported}
                  className={cn(
                    'flex items-center justify-center gap-3 px-8 py-4 rounded-full',
                    'bg-primary hover:bg-primary/90 text-primary-foreground',
                    'transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  )}
                >
                  <Mic className="w-5 h-5" />
                  <span className="font-medium">Iniciar conversacion</span>
                </button>
              ) : (
                <button
                  onClick={handleTogglePause}
                  className={cn(
                    'flex items-center justify-center gap-3 px-6 py-3 rounded-full',
                    'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
                    'transition-all duration-200 shadow-md hover:shadow-lg',
                    'border border-border/50'
                  )}
                >
                  <MicOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Pausar</span>
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Status text */}
        <div className="h-6 flex items-center justify-center">
          {!isPaused && state === 'listening' && (
            <p className="text-xs text-muted-foreground/70 animate-pulse">
              Escuchando... habla cuando quieras
            </p>
          )}
          {!isPaused && state === 'idle' && (
            <p className="text-xs text-muted-foreground/70">
              Listo para escuchar
            </p>
          )}
          {isPaused && state === 'idle' && (
            <p className="text-xs text-muted-foreground/50">
              Conversacion pausada
            </p>
          )}
        </div>

        {/* Visual indicator when listening */}
        {!isPaused && state === 'listening' && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        )}
      </footer>
    </div>
  )
}
