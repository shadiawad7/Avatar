// Conversation and state machine type definitions

export type ConversationState = 'idle' | 'listening' | 'thinking' | 'speaking'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ConversationContext {
  state: ConversationState
  messages: Message[]
  currentTranscript: string
  error: string | null
  isProcessing: boolean
}

// Audio-related types
export interface AudioChunk {
  blob: Blob
  duration: number
}

export interface AudioEnergyData {
  // Root Mean Square value (0-1)
  rms: number
  // Peak amplitude (0-1)
  peak: number
  // Average over recent frames for smoothing
  smoothedRms: number
}

// API response types
export interface TranscriptionResponse {
  text: string
  confidence?: number
}

export interface ChatResponse {
  message: string
  conversationId?: string
}

export interface TTSResponse {
  audioUrl: string
  duration?: number
}
