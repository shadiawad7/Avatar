'use client'

import { AVATARS } from '@/lib/avatar-config'
import type { AvatarConfig } from '@/types/avatar'
import { cn } from '@/lib/utils'
import { ExpressiveAvatar } from './expressive-avatar'

interface AvatarSelectorProps {
  selectedId: string
  onSelect: (avatar: AvatarConfig) => void
}

/**
 * Avatar selection gallery component
 * Displays the 3 mood avatars with image previews
 */
export function AvatarSelector({ selectedId, onSelect }: AvatarSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      <h2 className="text-xl font-medium text-foreground/90">Elige tu avatar</h2>
      
      <div className="flex flex-wrap justify-center gap-6">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onSelect(avatar)}
            className={cn(
              'group flex flex-col items-center gap-4 p-4 rounded-2xl transition-all duration-300',
              'hover:bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
              selectedId === avatar.id
                ? 'bg-secondary/70 ring-2 ring-primary/60'
                : 'bg-transparent'
            )}
          >
            {/* Image avatar preview */}
            <div
              className={cn(
                'relative transition-all duration-300 ease-out',
                selectedId === avatar.id ? 'scale-110' : 'group-hover:scale-105',
              )}
            >
              <ExpressiveAvatar
                config={avatar}
                isSpeaking={false}
                isListening={false}
                audioEnergy={0}
                size="sm"
              />
            </div>
            
            {/* Avatar info */}
            <div className="text-center">
              <p
                className={cn(
                  'font-semibold text-lg transition-colors',
                  selectedId === avatar.id ? 'text-primary' : 'text-foreground/80'
                )}
              >
                {avatar.name}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{avatar.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
