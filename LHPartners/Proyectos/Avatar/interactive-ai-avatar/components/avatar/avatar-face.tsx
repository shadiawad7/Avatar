'use client'

import { CartoonAvatar } from './avatars/cartoon-avatar'
import { SemiRealisticAvatar } from './avatars/semi-realistic-avatar'
import { RealisticAvatar } from './avatars/realistic-avatar'
import { MoodAvatar } from './avatars/mood-avatar'
import type { AvatarConfig, AvatarAnimationState } from '@/types/avatar'

interface AvatarFaceProps {
  config: AvatarConfig
  animationState: AvatarAnimationState
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Avatar Face component - renders the appropriate avatar based on style
 * Acts as a router to select the correct avatar component
 */
export function AvatarFace({ config, animationState, size = 'lg' }: AvatarFaceProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-72',
  }

  const avatarProps = { config, animationState, size }

  return (
    <div className={`${sizeClasses[size]} transition-transform duration-200`}>
      {config.style === 'cartoon' && <CartoonAvatar {...avatarProps} />}
      {config.style === 'semi-realistic' && <SemiRealisticAvatar {...avatarProps} />}
      {config.style === 'realistic' && <RealisticAvatar {...avatarProps} />}
      {config.style === 'mood' && <MoodAvatar {...avatarProps} />}
    </div>
  )
}
