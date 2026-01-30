'use client'

import { ExpressiveAvatar } from './expressive-avatar'
import type { AvatarConfig } from '@/types/avatar'
import type { ConversationState } from '@/types/conversation'

interface AvatarCanvasProps {
  avatar: AvatarConfig
  conversationState: ConversationState
  audioEnergy: number
}

/**
 * Avatar canvas component
 * Wraps the expressive SVG avatar with ambient effects
 */
export function AvatarCanvas({ avatar, conversationState, audioEnergy }: AvatarCanvasProps) {
  const isSpeaking = conversationState === 'speaking'
  const isListening = conversationState === 'listening'

  return (
    <div className="relative flex items-center justify-center p-8">
      {/* Expressive SVG avatar with facial animations */}
      <ExpressiveAvatar
        config={avatar}
        isSpeaking={isSpeaking}
        isListening={isListening}
        audioEnergy={audioEnergy}
        size="lg"
      />
    </div>
  )
}

/**
 * Get gradient background based on avatar mood
 */
function getMoodGradient(mood: AvatarConfig['mood']): string {
  switch (mood) {
    case 'happy':
      return 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, transparent 70%)'
    case 'angry':
      return 'radial-gradient(circle, rgba(239,68,68,0.5) 0%, transparent 70%)'
    case 'sad':
      return 'radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)'
    default:
      return 'radial-gradient(circle, rgba(148,163,184,0.3) 0%, transparent 70%)'
  }
}
