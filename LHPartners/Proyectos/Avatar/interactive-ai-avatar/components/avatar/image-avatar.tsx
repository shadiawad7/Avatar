'use client'

import { useState, useEffect } from 'react'
import type { AvatarConfig, AvatarMood } from '@/types/avatar'
import { cn } from '@/lib/utils'

interface ImageAvatarProps {
  config: AvatarConfig
  isSpeaking: boolean
  audioEnergy?: number
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Enhanced image-based avatar component
 * Displays the avatar JPG image with elegant CSS animations:
 * - Subtle breathing animation when idle
 * - Speaking animation with scale and movement
 * - Smooth transitions between states
 * - Simulated blink effect via brightness
 * - Mood-specific glow effects
 */
export function ImageAvatar({ 
  config, 
  isSpeaking, 
  audioEnergy = 0,
  size = 'lg' 
}: ImageAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false)

  // Simulated random blinking
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true)
      setTimeout(() => setIsBlinking(false), 150)
    }

    // Random blink every 2-5 seconds
    const scheduleNextBlink = () => {
      const delay = 2000 + Math.random() * 3000
      return setTimeout(() => {
        if (!isSpeaking) {
          blink()
        }
        scheduleNextBlink()
      }, delay)
    }

    const timer = scheduleNextBlink()
    return () => clearTimeout(timer)
  }, [isSpeaking])

  const sizeConfig = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-72 h-72 md:w-80 md:h-80',
  }

  // Dynamic speaking scale based on audio energy
  const speakingScale = isSpeaking ? 1 + (audioEnergy * 0.03) : 1
  const speakingY = isSpeaking ? -2 - (audioEnergy * 4) : 0

  return (
    <div 
      className={cn(
        'relative',
        sizeConfig[size],
      )}
    >
      {/* Ambient glow behind avatar */}
      <div 
        className={cn(
          'absolute inset-0 rounded-full blur-2xl transition-all duration-500',
          isSpeaking ? 'opacity-60 scale-110' : 'opacity-30 scale-100'
        )}
        style={{
          background: getMoodGradient(config.mood),
        }}
      />

      {/* Main avatar container */}
      <div
        className={cn(
          'relative w-full h-full rounded-full overflow-hidden',
          'shadow-2xl border-4 transition-all duration-300 ease-out',
          getMoodBorderColor(config.mood),
          // Breathing animation when idle
          !isSpeaking && 'animate-breathe',
        )}
        style={{
          transform: `translateY(${speakingY}px) scale(${speakingScale})`,
          transition: isSpeaking ? 'transform 0.1s ease-out' : 'transform 0.3s ease-out',
        }}
      >
        {/* Avatar image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={config.imageUrl || "/placeholder.svg"}
          alt={`Avatar ${config.name}`}
          className={cn(
            'w-full h-full object-cover object-center',
            'transition-all duration-200',
            // Simulated blink effect
            isBlinking && 'brightness-90',
          )}
          style={{
            // Slight zoom when speaking for emphasis
            transform: isSpeaking ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s ease-out',
          }}
        />

        {/* Overlay effects */}
        {/* Speaking highlight */}
        {isSpeaking && (
          <div 
            className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10 animate-pulse"
            style={{ animationDuration: '1s' }}
          />
        )}

        {/* Subtle vignette for depth */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.2)',
          }}
        />
      </div>

      {/* Speaking indicator ring */}
      {isSpeaking && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full border-2 animate-ping',
            getMoodBorderColor(config.mood),
          )}
          style={{
            animationDuration: '1.5s',
            opacity: 0.5,
          }}
        />
      )}
    </div>
  )
}

function getMoodGradient(mood: AvatarMood): string {
  switch (mood) {
    case 'happy':
      return 'radial-gradient(circle, rgba(74,222,128,0.4) 0%, rgba(34,197,94,0.2) 50%, transparent 70%)'
    case 'angry':
      return 'radial-gradient(circle, rgba(248,113,113,0.4) 0%, rgba(239,68,68,0.2) 50%, transparent 70%)'
    case 'sad':
      return 'radial-gradient(circle, rgba(147,197,253,0.4) 0%, rgba(96,165,250,0.2) 50%, transparent 70%)'
    default:
      return 'radial-gradient(circle, rgba(156,163,175,0.3) 0%, transparent 70%)'
  }
}

function getMoodBorderColor(mood: AvatarMood): string {
  switch (mood) {
    case 'happy':
      return 'border-green-400/60'
    case 'angry':
      return 'border-red-400/60'
    case 'sad':
      return 'border-blue-400/60'
    default:
      return 'border-gray-400/60'
  }
}
