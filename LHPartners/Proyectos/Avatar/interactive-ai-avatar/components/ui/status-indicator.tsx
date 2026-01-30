'use client'

import { cn } from '@/lib/utils'
import type { ConversationState } from '@/types/conversation'

interface StatusIndicatorProps {
  state: ConversationState
  error?: string | null
}

/**
 * Visual status indicator component
 * Shows current conversation state with appropriate styling
 */
export function StatusIndicator({ state, error }: StatusIndicatorProps) {
  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive">
        <div className="w-2 h-2 rounded-full bg-destructive" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    )
  }

  const stateConfig: Record<ConversationState, { label: string; color: string; animate: boolean }> = {
    idle: {
      label: 'Listo',
      color: 'bg-muted-foreground/50',
      animate: false,
    },
    listening: {
      label: 'Escuchando',
      color: 'bg-accent',
      animate: true,
    },
    thinking: {
      label: 'Pensando',
      color: 'bg-primary/70',
      animate: true,
    },
    speaking: {
      label: 'Hablando',
      color: 'bg-primary',
      animate: true,
    },
  }

  const config = stateConfig[state]

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full transition-colors duration-300',
        state === 'idle' ? 'bg-secondary/50' : 'bg-secondary/80'
      )}
    >
      <div className="relative">
        <div
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-300',
            config.color
          )}
        />
        {config.animate && (
          <div
            className={cn(
              'absolute inset-0 w-2 h-2 rounded-full animate-ping',
              config.color,
              'opacity-75'
            )}
          />
        )}
      </div>
      <span
        className={cn(
          'text-sm font-medium transition-colors duration-300',
          state === 'idle' ? 'text-muted-foreground' : 'text-foreground'
        )}
      >
        {config.label}
      </span>
    </div>
  )
}
