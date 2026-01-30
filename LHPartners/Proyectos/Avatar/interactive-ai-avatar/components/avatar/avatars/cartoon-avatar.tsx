'use client'

import type { AvatarProps } from '@/types/avatar'

/**
 * Luna - Cartoon style avatar
 * Friendly, rounded features with expressive animations
 * Uses SVG for smooth, scalable rendering
 */
export function CartoonAvatar({ config, animationState }: AvatarProps) {
  const { mouthOpenness, eyeOpenness, headTilt, eyebrowRaise } = animationState

  // Calculate mouth shape based on openness (0-1)
  const mouthHeight = 4 + mouthOpenness * 20
  const mouthWidth = 30 + mouthOpenness * 10
  const mouthY = 145 + mouthOpenness * 2

  // Eye calculations
  const eyeScaleY = 0.3 + eyeOpenness * 0.7

  // Head tilt transform
  const headRotation = headTilt * 3

  return (
    <svg
      viewBox="0 0 200 220"
      className="w-full h-full"
      style={{ transform: `rotate(${headRotation}deg)` }}
    >
      {/* Background glow */}
      <defs>
        <radialGradient id="cartoon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={config.accentColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={config.accentColor} stopOpacity="0" />
        </radialGradient>
        <filter id="cartoon-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Glow behind head */}
      <ellipse cx="100" cy="100" rx="90" ry="90" fill="url(#cartoon-glow)" />

      {/* Hair back */}
      <ellipse
        cx="100"
        cy="70"
        rx="75"
        ry="55"
        fill={config.hairColor}
        filter="url(#cartoon-shadow)"
      />

      {/* Face */}
      <ellipse
        cx="100"
        cy="100"
        rx="65"
        ry="70"
        fill={config.skinTone}
        filter="url(#cartoon-shadow)"
      />

      {/* Hair front */}
      <path
        d={`M 35 85 Q 35 40 100 35 Q 165 40 165 85 Q 140 70 100 75 Q 60 70 35 85`}
        fill={config.hairColor}
      />

      {/* Ears */}
      <ellipse cx="35" cy="100" rx="10" ry="15" fill={config.skinTone} />
      <ellipse cx="165" cy="100" rx="10" ry="15" fill={config.skinTone} />

      {/* Eyebrows */}
      <g transform={`translate(0, ${-eyebrowRaise * 5})`}>
        <path
          d="M 55 70 Q 70 65 85 70"
          stroke={config.hairColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 115 70 Q 130 65 145 70"
          stroke={config.hairColor}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Eyes */}
      <g transform={`translate(70, 90) scale(1, ${eyeScaleY})`}>
        <ellipse cx="0" cy="0" rx="12" ry="15" fill="white" />
        <ellipse cx="2" cy="2" rx="6" ry="8" fill={config.eyeColor} />
        <ellipse cx="4" cy="0" rx="2" ry="3" fill="white" />
      </g>
      <g transform={`translate(130, 90) scale(1, ${eyeScaleY})`}>
        <ellipse cx="0" cy="0" rx="12" ry="15" fill="white" />
        <ellipse cx="-2" cy="2" rx="6" ry="8" fill={config.eyeColor} />
        <ellipse cx="0" cy="0" rx="2" ry="3" fill="white" />
      </g>

      {/* Nose */}
      <ellipse cx="100" cy="115" rx="6" ry="4" fill={`${config.skinTone}dd`} />

      {/* Mouth */}
      <ellipse
        cx="100"
        cy={mouthY}
        rx={mouthWidth / 2}
        ry={mouthHeight / 2}
        fill="#3a2a2a"
      />
      {/* Tongue hint when mouth is open */}
      {mouthOpenness > 0.3 && (
        <ellipse
          cx="100"
          cy={mouthY + mouthHeight / 4}
          rx={mouthWidth / 3}
          ry={mouthHeight / 4}
          fill="#d4817a"
        />
      )}
      {/* Teeth when speaking */}
      {mouthOpenness > 0.2 && (
        <rect
          x={100 - mouthWidth / 3}
          y={mouthY - mouthHeight / 2}
          width={mouthWidth / 1.5}
          height={mouthHeight / 3}
          rx="2"
          fill="white"
        />
      )}

      {/* Cheek blush */}
      <ellipse cx="55" cy="115" rx="12" ry="8" fill="#ffb5b5" opacity="0.5" />
      <ellipse cx="145" cy="115" rx="12" ry="8" fill="#ffb5b5" opacity="0.5" />

      {/* Neck */}
      <rect x="85" y="165" width="30" height="30" fill={config.skinTone} />

      {/* Shoulders hint */}
      <ellipse cx="100" cy="205" rx="55" ry="20" fill={config.accentColor} />
    </svg>
  )
}
