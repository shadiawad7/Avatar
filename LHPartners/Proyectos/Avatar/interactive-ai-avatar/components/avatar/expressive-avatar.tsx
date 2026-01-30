'use client'

import { useEffect, useState, useRef } from 'react'
import type { AvatarConfig, AvatarMood } from '@/types/avatar'
import { cn } from '@/lib/utils'

interface ExpressiveAvatarProps {
  config: AvatarConfig
  isSpeaking: boolean
  isListening: boolean
  audioEnergy: number
  size?: 'sm' | 'md' | 'lg'
}

// Color palettes for each mood
const MOOD_COLORS: Record<AvatarMood, {
  skin: string
  skinShadow: string
  hair: string
  hairHighlight: string
  eyes: string
  eyesPupil: string
  shirt: string
  shirtAccent: string
  cheeks: string
  background: string
}> = {
  happy: {
    skin: '#FFDCB8',
    skinShadow: '#E8C4A0',
    hair: '#5D4037',
    hairHighlight: '#795548',
    eyes: '#4CAF50',
    eyesPupil: '#2E7D32',
    shirt: '#81C784',
    shirtAccent: '#4CAF50',
    cheeks: '#FFAB91',
    background: 'rgba(76, 175, 80, 0.15)',
  },
  angry: {
    skin: '#E8C4A0',
    skinShadow: '#D4A574',
    hair: '#212121',
    hairHighlight: '#424242',
    eyes: '#D32F2F',
    eyesPupil: '#B71C1C',
    shirt: '#455A64',
    shirtAccent: '#C62828',
    cheeks: '#FFAB91',
    background: 'rgba(211, 47, 47, 0.15)',
  },
  sad: {
    skin: '#FFE4D0',
    skinShadow: '#E8C4A0',
    hair: '#3E2723',
    hairHighlight: '#5D4037',
    eyes: '#64B5F6',
    eyesPupil: '#1976D2',
    shirt: '#78909C',
    shirtAccent: '#546E7A',
    cheeks: '#FFCCBC',
    background: 'rgba(100, 181, 246, 0.15)',
  },
}

export function ExpressiveAvatar({ 
  config, 
  isSpeaking, 
  isListening,
  audioEnergy, 
  size = 'lg' 
}: ExpressiveAvatarProps) {
  const [blinkState, setBlinkState] = useState(1) // 1 = open, 0 = closed
  const [lookDirection, setLookDirection] = useState({ x: 0, y: 0 })
  const blinkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const colors = MOOD_COLORS[config.mood]
  
  const sizeConfig = {
    sm: { width: 140, height: 160 },
    md: { width: 220, height: 250 },
    lg: { width: 320, height: 360 },
  }
  
  const { width, height } = sizeConfig[size]
  
  // Natural blinking
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 4000 // Blink every 2-6 seconds
      blinkTimeoutRef.current = setTimeout(() => {
        setBlinkState(0)
        setTimeout(() => {
          setBlinkState(1)
          scheduleBlink()
        }, 150)
      }, delay)
    }
    
    scheduleBlink()
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current)
    }
  }, [])
  
  // Random eye movement when listening
  useEffect(() => {
    if (!isListening) {
      setLookDirection({ x: 0, y: 0 })
      return
    }
    
    const interval = setInterval(() => {
      setLookDirection({
        x: (Math.random() - 0.5) * 6,
        y: (Math.random() - 0.5) * 4,
      })
    }, 800)
    
    return () => clearInterval(interval)
  }, [isListening])
  
  // Calculate mouth shape based on audio energy and mood
  const getMouthPath = () => {
    const energy = Math.min(1, audioEnergy * 1.5)
    const baseY = 195
    
    if (isSpeaking && energy > 0.1) {
      // Speaking - mouth opens based on energy
      const openAmount = energy * 20
      const width = 25 + energy * 10
      
      if (config.mood === 'happy') {
        // Happy speaking - wide smile that opens
        return `M ${100 - width} ${baseY} 
                Q 100 ${baseY + openAmount + 10} ${100 + width} ${baseY}
                Q 100 ${baseY + openAmount + 25} ${100 - width} ${baseY}`
      } else if (config.mood === 'angry') {
        // Angry speaking - tense mouth
        return `M ${100 - width} ${baseY + 5} 
                L ${100 + width} ${baseY + 5}
                L ${100 + width - 5} ${baseY + openAmount + 10}
                L ${100 - width + 5} ${baseY + openAmount + 10} Z`
      } else {
        // Sad speaking - downturned open mouth
        return `M ${100 - width} ${baseY - 3} 
                Q 100 ${baseY + openAmount + 5} ${100 + width} ${baseY - 3}
                Q 100 ${baseY + openAmount + 15} ${100 - width} ${baseY - 3}`
      }
    } else {
      // Not speaking - resting mouth based on mood
      if (config.mood === 'happy') {
        return `M 70 ${baseY} Q 100 ${baseY + 18} 130 ${baseY}`
      } else if (config.mood === 'angry') {
        return `M 75 ${baseY + 5} L 125 ${baseY + 5}`
      } else {
        return `M 75 ${baseY + 5} Q 100 ${baseY - 5} 125 ${baseY + 5}`
      }
    }
  }
  
  // Eyebrow positions based on mood and state
  const getEyebrowTransform = (isLeft: boolean) => {
    const baseAngle = isLeft ? -5 : 5
    let angle = baseAngle
    let yOffset = 0
    
    if (config.mood === 'angry') {
      angle = isLeft ? 15 : -15
      yOffset = 5
    } else if (config.mood === 'sad') {
      angle = isLeft ? -12 : 12
      yOffset = 3
    } else if (config.mood === 'happy') {
      angle = isLeft ? -8 : 8
      yOffset = -2
    }
    
    if (isSpeaking) {
      yOffset -= audioEnergy * 3
    }
    
    return `rotate(${angle}) translateY(${yOffset}px)`
  }
  
  // Eye size based on mood
  const eyeScaleY = blinkState * (config.mood === 'sad' ? 0.85 : 1)

  return (
    <div 
      className={cn(
        'relative transition-all duration-300',
        isSpeaking && 'animate-pulse-subtle'
      )}
      style={{ width, height }}
    >
      {/* Background glow */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl transition-all duration-500"
        style={{ 
          background: colors.background,
          transform: isSpeaking ? 'scale(1.3)' : 'scale(1)',
          opacity: isSpeaking ? 0.8 : 0.4,
        }}
      />
      
      <svg
        viewBox="0 0 200 230"
        width={width}
        height={height}
        className="relative z-10"
      >
        <defs>
          {/* Skin gradient */}
          <linearGradient id={`skin-${config.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.skin} />
            <stop offset="100%" stopColor={colors.skinShadow} />
          </linearGradient>
          
          {/* Hair gradient */}
          <linearGradient id={`hair-${config.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.hairHighlight} />
            <stop offset="100%" stopColor={colors.hair} />
          </linearGradient>
          
          {/* Eye shine */}
          <radialGradient id={`eyeShine-${config.id}`}>
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          
          {/* Shadow filter */}
          <filter id={`shadow-${config.id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>
        
        {/* Neck */}
        <path
          d="M 85 200 L 85 230 L 115 230 L 115 200"
          fill={`url(#skin-${config.id})`}
        />
        
        {/* Shoulders/Shirt */}
        <ellipse
          cx="100"
          cy="250"
          rx="70"
          ry="40"
          fill={colors.shirt}
        />
        <path
          d="M 90 220 L 100 240 L 110 220"
          fill={colors.shirtAccent}
          stroke={colors.shirtAccent}
          strokeWidth="2"
        />
        
        {/* Head shape */}
        <ellipse
          cx="100"
          cy="120"
          rx="75"
          ry="90"
          fill={`url(#skin-${config.id})`}
          filter={`url(#shadow-${config.id})`}
        />
        
        {/* Ears */}
        <ellipse cx="28" cy="130" rx="12" ry="18" fill={colors.skinShadow} />
        <ellipse cx="172" cy="130" rx="12" ry="18" fill={colors.skinShadow} />
        <ellipse cx="28" cy="130" rx="8" ry="12" fill={colors.skin} />
        <ellipse cx="172" cy="130" rx="8" ry="12" fill={colors.skin} />
        
        {/* Hair back */}
        <ellipse
          cx="100"
          cy="70"
          rx="72"
          ry="55"
          fill={`url(#hair-${config.id})`}
        />
        
        {/* Hair front/style based on mood */}
        {config.mood === 'happy' && (
          <>
            <path
              d="M 35 90 Q 50 40 100 35 Q 150 40 165 90 Q 160 60 100 50 Q 40 60 35 90"
              fill={colors.hair}
            />
            <path
              d="M 70 50 Q 80 30 100 28 Q 120 30 130 50"
              fill={colors.hairHighlight}
              opacity="0.6"
            />
          </>
        )}
        {config.mood === 'angry' && (
          <>
            <path
              d="M 30 100 Q 40 50 100 40 Q 160 50 170 100 Q 165 70 100 60 Q 35 70 30 100"
              fill={colors.hair}
            />
            <path
              d="M 50 70 L 65 55 L 80 70 L 95 50 L 110 70 L 125 50 L 140 70 L 150 60"
              fill="none"
              stroke={colors.hairHighlight}
              strokeWidth="8"
              strokeLinecap="round"
            />
          </>
        )}
        {config.mood === 'sad' && (
          <>
            <path
              d="M 32 95 Q 45 45 100 38 Q 155 45 168 95 Q 160 65 100 55 Q 40 65 32 95"
              fill={colors.hair}
            />
            <path
              d="M 55 80 Q 75 55 100 50 Q 125 55 145 80"
              fill={colors.hairHighlight}
              opacity="0.5"
            />
            {/* Messy strands for sad */}
            <path
              d="M 45 85 Q 40 70 50 60"
              fill="none"
              stroke={colors.hair}
              strokeWidth="6"
              strokeLinecap="round"
            />
          </>
        )}
        
        {/* Eyebrows */}
        <g style={{ transform: getEyebrowTransform(true), transformOrigin: '65px 100px' }}>
          <path
            d="M 50 100 Q 65 95 80 100"
            fill="none"
            stroke={colors.hair}
            strokeWidth={config.mood === 'angry' ? 5 : 4}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </g>
        <g style={{ transform: getEyebrowTransform(false), transformOrigin: '135px 100px' }}>
          <path
            d="M 120 100 Q 135 95 150 100"
            fill="none"
            stroke={colors.hair}
            strokeWidth={config.mood === 'angry' ? 5 : 4}
            strokeLinecap="round"
            className="transition-all duration-200"
          />
        </g>
        
        {/* Eyes */}
        <g className="transition-transform duration-100" style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: '65px 130px' }}>
          {/* Left eye white */}
          <ellipse cx="65" cy="130" rx="18" ry="22" fill="white" />
          {/* Left iris */}
          <ellipse 
            cx={65 + lookDirection.x} 
            cy={130 + lookDirection.y} 
            rx="12" 
            ry="14" 
            fill={colors.eyes}
            className="transition-all duration-300"
          />
          {/* Left pupil */}
          <ellipse 
            cx={65 + lookDirection.x} 
            cy={130 + lookDirection.y} 
            rx="6" 
            ry="7" 
            fill={colors.eyesPupil}
            className="transition-all duration-300"
          />
          {/* Left eye shine */}
          <ellipse cx={60 + lookDirection.x * 0.5} cy={125 + lookDirection.y * 0.5} rx="4" ry="5" fill={`url(#eyeShine-${config.id})`} />
        </g>
        
        <g className="transition-transform duration-100" style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: '135px 130px' }}>
          {/* Right eye white */}
          <ellipse cx="135" cy="130" rx="18" ry="22" fill="white" />
          {/* Right iris */}
          <ellipse 
            cx={135 + lookDirection.x} 
            cy={130 + lookDirection.y} 
            rx="12" 
            ry="14" 
            fill={colors.eyes}
            className="transition-all duration-300"
          />
          {/* Right pupil */}
          <ellipse 
            cx={135 + lookDirection.x} 
            cy={130 + lookDirection.y} 
            rx="6" 
            ry="7" 
            fill={colors.eyesPupil}
            className="transition-all duration-300"
          />
          {/* Right eye shine */}
          <ellipse cx={130 + lookDirection.x * 0.5} cy={125 + lookDirection.y * 0.5} rx="4" ry="5" fill={`url(#eyeShine-${config.id})`} />
        </g>
        
        {/* Nose */}
        <path
          d="M 100 140 L 95 165 Q 100 170 105 165 L 100 140"
          fill={colors.skinShadow}
          opacity="0.5"
        />
        
        {/* Cheeks - more visible when happy */}
        {config.mood === 'happy' && (
          <>
            <ellipse cx="45" cy="160" rx="12" ry="8" fill={colors.cheeks} opacity="0.5" />
            <ellipse cx="155" cy="160" rx="12" ry="8" fill={colors.cheeks} opacity="0.5" />
          </>
        )}
        
        {/* Mouth */}
        <path
          d={getMouthPath()}
          fill={isSpeaking && audioEnergy > 0.1 ? '#8B0000' : 'none'}
          stroke={config.mood === 'happy' ? colors.eyes : colors.hair}
          strokeWidth="3"
          strokeLinecap="round"
          className="transition-all duration-75"
        />
        
        {/* Teeth when speaking with open mouth */}
        {isSpeaking && audioEnergy > 0.3 && (
          <rect
            x="85"
            y="197"
            width="30"
            height={Math.min(10, audioEnergy * 15)}
            rx="2"
            fill="white"
            opacity="0.9"
          />
        )}
        
        {/* Sad tears */}
        {config.mood === 'sad' && isListening && (
          <>
            <ellipse cx="50" cy="155" rx="3" ry="5" fill="#64B5F6" opacity="0.6" />
          </>
        )}
        
        {/* Angry vein */}
        {config.mood === 'angry' && isSpeaking && audioEnergy > 0.5 && (
          <path
            d="M 155 80 L 160 75 L 158 85 L 165 80"
            fill="none"
            stroke="#D32F2F"
            strokeWidth="2"
            opacity="0.7"
          />
        )}
      </svg>
    </div>
  )
}
