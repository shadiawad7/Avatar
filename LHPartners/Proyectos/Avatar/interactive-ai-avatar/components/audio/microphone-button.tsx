'use client'

import { cn } from '@/lib/utils'
import type { ConversationState } from '@/types/conversation'

interface MicrophoneButtonProps {
  state: ConversationState
  isRecording: boolean
  isSupported: boolean
  onToggle: () => void
}

/**
 * Main microphone button component
 * Toggle button for voice input (tap to start, tap to stop)
 * Visual feedback for different states
 */
export function MicrophoneButton({
  state,
  isRecording,
  isSupported,
  onToggle,
}: MicrophoneButtonProps) {
  const isListening = state === 'listening'
  const isThinking = state === 'thinking'
  const isSpeaking = state === 'speaking'
  const isDisabled = !isSupported || isThinking

  const handleClick = () => {
    if (!isDisabled) {
      onToggle()
    }
  }

  return (
    <div className="relative">
      {/* Pulse ring when listening */}
      {isListening && (
        <div className="absolute inset-0 rounded-full bg-accent/30 animate-ping" />
      )}
      
      {/* Outer glow ring */}
      <div
        className={cn(
          'absolute -inset-3 rounded-full transition-all duration-500',
          isListening
            ? 'bg-accent/20 scale-100'
            : isSpeaking
              ? 'bg-primary/20 scale-100'
              : 'bg-transparent scale-95'
        )}
      />

      {/* Main button */}
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          'relative z-10 flex items-center justify-center',
          'w-20 h-20 rounded-full',
          'transition-all duration-300 ease-out',
          'focus:outline-none focus:ring-4 focus:ring-primary/30',
          isListening
            ? 'bg-accent text-accent-foreground scale-110 animate-mic-pulse'
            : isSpeaking
              ? 'bg-primary/80 text-primary-foreground scale-100'
              : isThinking
                ? 'bg-muted text-muted-foreground scale-100 cursor-wait'
                : 'bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90 active:scale-95',
          isDisabled && !isThinking && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={
          isListening ? 'Toca para parar' : 
          isThinking ? 'Procesando...' : 
          isSpeaking ? 'Toca para interrumpir' :
          'Toca para hablar'
        }
      >
        {/* Icon based on state */}
        {isThinking ? (
          <ThinkingSpinner />
        ) : isListening ? (
          <StopIcon />
        ) : (
          <MicrophoneIcon isActive={isSpeaking} />
        )}
      </button>

      {/* State label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className={cn(
            'text-sm font-medium transition-colors duration-300',
            isListening
              ? 'text-accent'
              : isSpeaking
                ? 'text-primary'
                : isThinking
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/70'
          )}
        >
          {isListening
            ? 'Escuchando...'
            : isThinking
              ? 'Pensando...'
              : isSpeaking
                ? 'Hablando...'
                : 'Toca para hablar'}
        </span>
      </div>
    </div>
  )
}

function MicrophoneIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn(
        'w-8 h-8 transition-transform duration-200',
        isActive && 'scale-110'
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8"
      fill="currentColor"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function ThinkingSpinner() {
  return (
    <svg
      className="w-8 h-8 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
