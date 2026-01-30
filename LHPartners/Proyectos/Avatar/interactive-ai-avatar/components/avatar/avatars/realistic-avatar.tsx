'use client'

import type { AvatarProps } from '@/types/avatar'

/**
 * Nova - Realistic style avatar
 * Sophisticated, modern appearance with subtle animations
 * More detailed shading and refined features
 */
export function RealisticAvatar({ config, animationState }: AvatarProps) {
  const { mouthOpenness, eyeOpenness, headTilt, eyebrowRaise } = animationState

  // Very subtle mouth movements
  const mouthHeight = 3 + mouthOpenness * 10
  const mouthWidth = 22 + mouthOpenness * 6
  const mouthY = 135

  // Realistic eye behavior
  const eyeScaleY = 0.2 + eyeOpenness * 0.8
  const eyelidOffset = (1 - eyeOpenness) * 8

  // Minimal head tilt
  const headRotation = headTilt * 1.5

  return (
    <svg
      viewBox="0 0 200 220"
      className="w-full h-full"
      style={{ transform: `rotate(${headRotation}deg)` }}
    >
      <defs>
        <radialGradient id="real-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={config.accentColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={config.accentColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="real-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={config.skinTone} />
          <stop offset="50%" stopColor={config.skinTone} />
          <stop offset="100%" stopColor={`${config.skinTone}cc`} />
        </linearGradient>
        <linearGradient id="real-skin-shadow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`${config.skinTone}88`} />
          <stop offset="50%" stopColor={config.skinTone} />
          <stop offset="100%" stopColor={`${config.skinTone}88`} />
        </linearGradient>
        <filter id="real-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2" />
        </filter>
        <filter id="blur-soft">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>

      {/* Background glow */}
      <ellipse cx="100" cy="100" rx="80" ry="80" fill="url(#real-glow)" />

      {/* Hair back - styled */}
      <path
        d="M 35 85 Q 35 30 100 25 Q 165 30 165 85 Q 165 75 140 65 Q 100 55 60 65 Q 35 75 35 85"
        fill={config.hairColor}
        filter="url(#real-shadow)"
      />

      {/* Face shape - realistic proportions */}
      <path
        d="M 48 85 Q 45 95 48 115 Q 52 145 75 158 Q 90 165 100 165 Q 110 165 125 158 Q 148 145 152 115 Q 155 95 152 85 Q 150 55 100 50 Q 50 55 48 85"
        fill="url(#real-skin)"
        filter="url(#real-shadow)"
      />

      {/* Face shading */}
      <path
        d="M 52 90 Q 50 110 55 130 Q 60 145 75 155"
        stroke={`${config.skinTone}88`}
        strokeWidth="8"
        fill="none"
        opacity="0.3"
        filter="url(#blur-soft)"
      />
      <path
        d="M 148 90 Q 150 110 145 130 Q 140 145 125 155"
        stroke={`${config.skinTone}88`}
        strokeWidth="8"
        fill="none"
        opacity="0.3"
        filter="url(#blur-soft)"
      />

      {/* Ears */}
      <ellipse cx="48" cy="95" rx="6" ry="12" fill={config.skinTone} />
      <ellipse cx="152" cy="95" rx="6" ry="12" fill={config.skinTone} />

      {/* Hair front - modern style */}
      <path
        d={`M 45 75 Q 45 35 100 32 Q 155 35 155 75 Q 155 60 130 52 Q 100 45 70 52 Q 45 60 45 75`}
        fill={config.hairColor}
      />
      {/* Hair texture lines */}
      <path d="M 55 60 Q 60 50 75 48" stroke={`${config.hairColor}dd`} strokeWidth="2" fill="none" />
      <path d="M 100 45 Q 110 44 125 48" stroke={`${config.hairColor}dd`} strokeWidth="2" fill="none" />

      {/* Eyebrows - natural */}
      <g transform={`translate(0, ${-eyebrowRaise * 3})`}>
        <path
          d="M 62 74 Q 68 71 76 72 Q 82 73 85 75"
          stroke={config.hairColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <path
          d="M 115 75 Q 118 73 124 72 Q 132 71 138 74"
          stroke={config.hairColor}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </g>

      {/* Eyes - detailed */}
      <g transform={`translate(73, 90)`}>
        {/* Eye socket */}
        <ellipse cx="0" cy="0" rx="10" ry="7" fill={`${config.skinTone}99`} />
        {/* Sclera */}
        <ellipse cx="0" cy="0" rx="9" ry={6 * eyeScaleY} fill="#fafafa" />
        {/* Iris with gradient effect */}
        <ellipse cx="0.5" cy={0.5 * eyeScaleY} rx="4" ry={4 * eyeScaleY} fill={config.eyeColor} />
        <ellipse cx="0.5" cy={0.5 * eyeScaleY} rx="3" ry={3 * eyeScaleY} fill={`${config.eyeColor}dd`} />
        {/* Pupil */}
        <ellipse cx="0.5" cy={0.5 * eyeScaleY} rx="2" ry={2 * eyeScaleY} fill="#0a0a0a" />
        {/* Highlight */}
        <ellipse cx="2" cy={-1 * eyeScaleY} rx="1" ry={1 * eyeScaleY} fill="white" opacity="0.9" />
        {/* Upper eyelid */}
        <path
          d={`M -9 ${-5 + eyelidOffset} Q 0 ${-8 + eyelidOffset} 9 ${-5 + eyelidOffset}`}
          fill={config.skinTone}
        />
        {/* Eyelashes hint */}
        <path
          d={`M -8 ${-5 + eyelidOffset} Q 0 ${-7 + eyelidOffset} 8 ${-5 + eyelidOffset}`}
          stroke={config.hairColor}
          strokeWidth="0.5"
          fill="none"
          opacity="0.5"
        />
      </g>

      <g transform={`translate(127, 90)`}>
        <ellipse cx="0" cy="0" rx="10" ry="7" fill={`${config.skinTone}99`} />
        <ellipse cx="0" cy="0" rx="9" ry={6 * eyeScaleY} fill="#fafafa" />
        <ellipse cx="-0.5" cy={0.5 * eyeScaleY} rx="4" ry={4 * eyeScaleY} fill={config.eyeColor} />
        <ellipse cx="-0.5" cy={0.5 * eyeScaleY} rx="3" ry={3 * eyeScaleY} fill={`${config.eyeColor}dd`} />
        <ellipse cx="-0.5" cy={0.5 * eyeScaleY} rx="2" ry={2 * eyeScaleY} fill="#0a0a0a" />
        <ellipse cx="1" cy={-1 * eyeScaleY} rx="1" ry={1 * eyeScaleY} fill="white" opacity="0.9" />
        <path
          d={`M -9 ${-5 + eyelidOffset} Q 0 ${-8 + eyelidOffset} 9 ${-5 + eyelidOffset}`}
          fill={config.skinTone}
        />
        <path
          d={`M -8 ${-5 + eyelidOffset} Q 0 ${-7 + eyelidOffset} 8 ${-5 + eyelidOffset}`}
          stroke={config.hairColor}
          strokeWidth="0.5"
          fill="none"
          opacity="0.5"
        />
      </g>

      {/* Nose - refined */}
      <path
        d="M 100 82 L 100 112 L 97 116 Q 94 118 93 116"
        fill="none"
        stroke={`${config.skinTone}aa`}
        strokeWidth="1"
      />
      <path
        d="M 100 112 L 103 116 Q 106 118 107 116"
        fill="none"
        stroke={`${config.skinTone}aa`}
        strokeWidth="1"
      />
      <ellipse cx="100" cy="116" rx="6" ry="3" fill={`${config.skinTone}ee`} />

      {/* Mouth - subtle */}
      <g transform={`translate(100, ${mouthY})`}>
        {/* Lips */}
        <path
          d={`M ${-mouthWidth / 2} 0 Q ${-mouthWidth / 4} ${mouthHeight / 3} 0 ${mouthHeight / 4} Q ${mouthWidth / 4} ${mouthHeight / 3} ${mouthWidth / 2} 0`}
          fill="#a08080"
        />
        <path
          d={`M ${-mouthWidth / 2} 0 Q ${-mouthWidth / 4} ${-mouthHeight / 4} 0 ${-mouthHeight / 5} Q ${mouthWidth / 4} ${-mouthHeight / 4} ${mouthWidth / 2} 0`}
          fill="#b09090"
        />
        {/* Inner mouth when open */}
        {mouthOpenness > 0.15 && (
          <ellipse cx="0" cy={mouthHeight / 6} rx={mouthWidth / 3} ry={mouthHeight / 3} fill="#2a1a1a" />
        )}
      </g>

      {/* Neck */}
      <path
        d="M 82 158 L 82 180 Q 82 195 100 195 Q 118 195 118 180 L 118 158"
        fill={config.skinTone}
      />
      {/* Neck shadow */}
      <path
        d="M 85 158 L 115 158 L 115 165 Q 100 170 85 165 Z"
        fill={`${config.skinTone}aa`}
        opacity="0.3"
      />

      {/* Collar/shoulders */}
      <ellipse cx="100" cy="205" rx="48" ry="16" fill={config.accentColor} />
      <path
        d="M 68 195 Q 100 205 132 195 L 128 212 Q 100 218 72 212 Z"
        fill={config.accentColor}
      />
      {/* Collar detail */}
      <path
        d="M 88 195 L 100 205 L 112 195"
        stroke={`${config.accentColor}88`}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}
