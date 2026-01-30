'use client'

import type { AvatarProps, AvatarMood } from '@/types/avatar'

export function MoodAvatar({ config, animationState }: AvatarProps) {
  const { mouthOpenness, eyeOpenness, headTilt, eyebrowRaise } = animationState
  const mood = config.mood || 'neutral'

  const headRotation = headTilt * 3
  const moodConfig = getMoodConfig(mood, config.accentColor)

  return (
    <svg
      viewBox="0 0 200 220"
      className="w-full h-full"
      style={{ transform: `rotate(${headRotation}deg)` }}
    >
      <defs>
        <radialGradient id={`mood-glow-${mood}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={moodConfig.glowColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={moodConfig.glowColor} stopOpacity="0" />
        </radialGradient>
        <filter id="mood-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Glow */}
      <ellipse cx="100" cy="100" rx="95" ry="95" fill={`url(#mood-glow-${mood})`} />

      {/* Hair */}
      <ellipse cx="100" cy="70" rx="75" ry="55" fill={config.hairColor} filter="url(#mood-shadow)" />
      <path
        d="M 35 85 Q 35 40 100 35 Q 165 40 165 85 Q 140 70 100 75 Q 60 70 35 85"
        fill={config.hairColor}
      />

      {/* Face */}
      <ellipse cx="100" cy="100" rx="65" ry="70" fill={config.skinTone} filter="url(#mood-shadow)" />

      {/* Ears */}
      <ellipse cx="35" cy="100" rx="10" ry="15" fill={config.skinTone} />
      <ellipse cx="165" cy="100" rx="10" ry="15" fill={config.skinTone} />

      {/* Eyebrows */}
      <MoodEyebrows mood={mood} eyebrowRaise={eyebrowRaise} hairColor={config.hairColor} />

      {/* Eyes */}
      <MoodEyes mood={mood} eyeOpenness={eyeOpenness} eyeColor={config.eyeColor} />

      {/* Nose */}
      <ellipse cx="100" cy="115" rx="6" ry="4" fill={`${config.skinTone}dd`} />

      {/* Mouth */}
      <MoodMouth mood={mood} mouthOpenness={mouthOpenness} />

      {/* Blush */}
      {moodConfig.showBlush && (
        <>
          <ellipse cx="55" cy="115" rx="12" ry="8" fill={moodConfig.blushColor} opacity="0.5" />
          <ellipse cx="145" cy="115" rx="12" ry="8" fill={moodConfig.blushColor} opacity="0.5" />
        </>
      )}

      {/* Tears */}
      {mood === 'sad' && (
        <>
          <ellipse cx="60" cy="105" rx="3" ry="6" fill="#7DD3FC" opacity="0.7" />
          <ellipse cx="140" cy="108" rx="3" ry="5" fill="#7DD3FC" opacity="0.6" />
        </>
      )}

      {/* Anger */}
      {mood === 'angry' && (
        <path d="M 160 50 L 165 55 M 163 47 L 168 52" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Neck */}
      <rect x="85" y="165" width="30" height="30" fill={config.skinTone} />

      {/* Shoulders */}
      <ellipse cx="100" cy="205" rx="55" ry="20" fill={moodConfig.glowColor} />
    </svg>
  )
}

function getMoodConfig(mood: AvatarMood, accentColor: string) {
  return {
    happy: { glowColor: '#FCD34D', blushColor: '#FCA5A5', showBlush: true },
    neutral: { glowColor: accentColor, blushColor: '#FCA5A5', showBlush: false },
    angry: { glowColor: '#EF4444', blushColor: '#FCA5A5', showBlush: true },
    sad: { glowColor: '#60A5FA', blushColor: '#93C5FD', showBlush: false },
  }[mood]
}

function MoodMouth({ mood, mouthOpenness }: { mood: AvatarMood; mouthOpenness: number }) {
  if (mouthOpenness > 0.1 && mood === 'happy') {
    return (
      <>
        <path
          d={`M 85 140 Q 100 ${150 + mouthOpenness * 10} 115 140`}
          fill="#3a2a2a"
        />
        <path
          d={`M 90 ${144 + mouthOpenness * 2}
              Q 100 ${145 + mouthOpenness * 2}
              110 ${144 + mouthOpenness * 2}`}
          fill="white"
          opacity="0.9"
        />
      </>
    )
  }

  if (mouthOpenness > 0.1 && mood === 'angry') {
    return (
      <>
        <path
          d={`M 80 145 Q 100 ${152 + mouthOpenness * 10} 120 145`}
          fill="#3a2a2a"
        />
        <path
          d={`M 90 ${148 + mouthOpenness * 2}
              Q 100 ${149 + mouthOpenness * 2}
              110 ${148 + mouthOpenness * 2}`}
          fill="white"
          opacity="0.9"
        />
      </>
    )
  }

  if (mood === 'sad') {
    return (
      <path
        d="M 80 155 Q 100 142 120 155"
        stroke="#3a2a2a"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    )
  }

  return (
    <path
      d="M 80 140 Q 100 155 120 140"
      stroke="#3a2a2a"
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
    />
  )
}

function MoodEyebrows({ mood, eyebrowRaise, hairColor }: { mood: AvatarMood; eyebrowRaise: number; hairColor: string }) {
  const offset = -eyebrowRaise * 5
  const shapes = {
    happy: [`M 55 ${68 + offset} Q 70 ${62 + offset} 85 ${68 + offset}`, `M 115 ${68 + offset} Q 130 ${62 + offset} 145 ${68 + offset}`],
    neutral: [`M 55 ${70 + offset} Q 70 ${68 + offset} 85 ${70 + offset}`, `M 115 ${70 + offset} Q 130 ${68 + offset} 145 ${70 + offset}`],
    angry: [`M 55 ${75 + offset} Q 70 ${65 + offset} 85 ${68 + offset}`, `M 115 ${68 + offset} Q 130 ${65 + offset} 145 ${75 + offset}`],
    sad: [`M 55 ${65 + offset} Q 70 ${72 + offset} 85 ${70 + offset}`, `M 115 ${70 + offset} Q 130 ${72 + offset} 145 ${65 + offset}`],
  }[mood]

  return (
    <>
      <path d={shapes[0]} stroke={hairColor} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d={shapes[1]} stroke={hairColor} strokeWidth="4" strokeLinecap="round" fill="none" />
    </>
  )
}

function MoodEyes({ mood, eyeOpenness, eyeColor }: { mood: AvatarMood; eyeOpenness: number; eyeColor: string }) {
  const scaleY = 0.3 + eyeOpenness * 0.7
  const offset = mood === 'sad' ? 4 : mood === 'angry' ? 3 : 0

  return (
    <>
      <g transform={`translate(70,90) scale(1,${scaleY})`}>
        <ellipse rx="12" ry="15" fill="white" />
        <ellipse cx="2" cy={offset} rx="6" ry="8" fill={eyeColor} />
      </g>
      <g transform={`translate(130,90) scale(1,${scaleY})`}>
        <ellipse rx="12" ry="15" fill="white" />
        <ellipse cx="-2" cy={offset} rx="6" ry="8" fill={eyeColor} />
      </g>
    </>
  )
}
