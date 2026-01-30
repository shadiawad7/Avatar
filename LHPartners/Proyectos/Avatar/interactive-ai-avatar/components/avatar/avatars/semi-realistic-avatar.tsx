'use client'

import type { AvatarProps } from '@/types/avatar'

/**
 * Alex - Semi-realistic style avatar
 * Professional appearance with more defined features
 * Balanced between cartoon and realistic
 */
export function SemiRealisticAvatar({ config, animationState }: AvatarProps) {
  const { mouthOpenness, eyeOpenness, headTilt, eyebrowRaise } = animationState

  // Mouth animation - more subtle than cartoon
  const mouthHeight = 2 + mouthOpenness * 14
  const mouthWidth = 25 + mouthOpenness * 8
  const mouthY = 138 + mouthOpenness * 1

  // Eye calculations with more realistic blinking
  const eyeScaleY = 0.15 + eyeOpenness * 0.85
  const eyelidOffset = (1 - eyeOpenness) * 10

  // Head tilt - more subtle
  const headRotation = headTilt * 2

  return (
    <svg
      viewBox="0 0 200 220"
      className="w-full h-full"
      style={{ transform: `rotate(${headRotation}deg)` }}
    >
      <defs>
        <radialGradient id="semi-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={config.accentColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={config.accentColor} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="semi-skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={config.skinTone} />
          <stop offset="100%" stopColor={`${config.skinTone}dd`} />
        </linearGradient>
        <filter id="semi-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.25" />
        </filter>
        <clipPath id="face-clip">
          <ellipse cx="100" cy="95" rx="58" ry="65" />
        </clipPath>
      </defs>

      {/* Background glow */}
      <ellipse cx="100" cy="100" rx="85" ry="85" fill="url(#semi-glow)" />

      {/* Hair back layer */}
      <ellipse
        cx="100"
        cy="65"
        rx="68"
        ry="50"
        fill={config.hairColor}
        filter="url(#semi-shadow)"
      />

      {/* Face shape - more oval */}
      <ellipse
        cx="100"
        cy="95"
        rx="58"
        ry="65"
        fill="url(#semi-skin)"
        filter="url(#semi-shadow)"
      />

      {/* Jaw definition */}
      <path
        d="M 50 100 Q 50 150 100 165 Q 150 150 150 100"
        fill={config.skinTone}
      />

      {/* Ears */}
      <ellipse cx="42" cy="95" rx="8" ry="14" fill={config.skinTone} />
      <ellipse cx="158" cy="95" rx="8" ry="14" fill={config.skinTone} />
      <ellipse cx="42" cy="95" rx="4" ry="8" fill={`${config.skinTone}cc`} />
      <ellipse cx="158" cy="95" rx="4" ry="8" fill={`${config.skinTone}cc`} />

      {/* Hair front */}
      <path
        d={`M 42 80 Q 42 35 100 30 Q 158 35 158 80 Q 145 55 100 58 Q 55 55 42 80`}
        fill={config.hairColor}
      />
      {/* Hair side strands */}
      <path
        d="M 45 70 Q 50 85 48 95"
        stroke={config.hairColor}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 155 70 Q 150 85 152 95"
        stroke={config.hairColor}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyebrows - more defined */}
      <g transform={`translate(0, ${-eyebrowRaise * 4})`}>
        <path
          d="M 58 72 Q 68 68 82 72"
          stroke={config.hairColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 118 72 Q 132 68 142 72"
          stroke={config.hairColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Eyes with more detail */}
      <g transform={`translate(70, 88)`}>
        {/* Eye socket shadow */}
        <ellipse cx="0" cy="0" rx="12" ry="10" fill={`${config.skinTone}99`} />
        {/* Eyeball */}
        <ellipse cx="0" cy="0" rx="10" ry={8 * eyeScaleY} fill="white" />
        {/* Iris */}
        <ellipse cx="1" cy={1 * eyeScaleY} rx="5" ry={5 * eyeScaleY} fill={config.eyeColor} />
        {/* Pupil */}
        <ellipse cx="1" cy={1 * eyeScaleY} rx="2.5" ry={2.5 * eyeScaleY} fill="#1a1a1a" />
        {/* Highlight */}
        <ellipse cx="3" cy={-1 * eyeScaleY} rx="1.5" ry={1.5 * eyeScaleY} fill="white" opacity="0.8" />
        {/* Upper eyelid */}
        <path
          d={`M -10 ${-8 + eyelidOffset} Q 0 ${-12 + eyelidOffset} 10 ${-8 + eyelidOffset}`}
          stroke={config.skinTone}
          strokeWidth="4"
          fill={config.skinTone}
        />
      </g>

      <g transform={`translate(130, 88)`}>
        <ellipse cx="0" cy="0" rx="12" ry="10" fill={`${config.skinTone}99`} />
        <ellipse cx="0" cy="0" rx="10" ry={8 * eyeScaleY} fill="white" />
        <ellipse cx="-1" cy={1 * eyeScaleY} rx="5" ry={5 * eyeScaleY} fill={config.eyeColor} />
        <ellipse cx="-1" cy={1 * eyeScaleY} rx="2.5" ry={2.5 * eyeScaleY} fill="#1a1a1a" />
        <ellipse cx="1" cy={-1 * eyeScaleY} rx="1.5" ry={1.5 * eyeScaleY} fill="white" opacity="0.8" />
        <path
          d={`M -10 ${-8 + eyelidOffset} Q 0 ${-12 + eyelidOffset} 10 ${-8 + eyelidOffset}`}
          stroke={config.skinTone}
          strokeWidth="4"
          fill={config.skinTone}
        />
      </g>

      {/* Nose - more defined */}
      <path
        d="M 100 85 L 100 115 Q 95 120 92 118 Q 100 122 108 118 Q 105 120 100 115"
        fill={`${config.skinTone}dd`}
        stroke={`${config.skinTone}aa`}
        strokeWidth="0.5"
      />

      {/* Mouth */}
      <g transform={`translate(100, ${mouthY})`}>
        {/* Lips outline */}
        <ellipse cx="0" cy="0" rx={mouthWidth / 2} ry={mouthHeight / 2} fill="#8b6b6b" />
        {/* Inner mouth */}
        {mouthOpenness > 0.1 && (
          <ellipse cx="0" cy="1" rx={mouthWidth / 2.5} ry={Math.max(mouthHeight / 2.5, 2)} fill="#3a2a2a" />
        )}
        {/* Upper lip definition */}
        <path
          d={`M ${-mouthWidth / 2} 0 Q ${-mouthWidth / 4} ${-mouthHeight / 3} 0 ${-mouthHeight / 4} Q ${mouthWidth / 4} ${-mouthHeight / 3} ${mouthWidth / 2} 0`}
          fill="#9b7b7b"
        />
      </g>

      {/* Neck */}
      <path
        d="M 80 155 L 80 185 Q 80 195 100 195 Q 120 195 120 185 L 120 155"
        fill={config.skinTone}
      />

      {/* Collar/shoulders */}
      <ellipse cx="100" cy="205" rx="50" ry="18" fill={config.accentColor} />
      <path
        d="M 65 195 Q 100 210 135 195 L 130 215 Q 100 220 70 215 Z"
        fill={config.accentColor}
      />
    </svg>
  )
}
