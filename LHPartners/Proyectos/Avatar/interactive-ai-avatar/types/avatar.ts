// Avatar type definitions for the interactive AI avatar system

export type AvatarMood = 'happy' | 'angry' | 'sad'

export interface AvatarConfig {
  id: string
  name: string
  mood: AvatarMood
  description: string
  imageUrl: string
}

export interface AvatarProps {
  config: AvatarConfig
  isSpeaking: boolean
  size?: 'sm' | 'md' | 'lg'
}
