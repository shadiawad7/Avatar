'use client'

import { useState, useCallback, useRef } from 'react'
import { useWebSpeech } from './use-web-speech'
import { useBrowserTTS } from './use-browser-tts'
import type { ConversationState, Message } from '@/types/conversation'
import type { AvatarConfig, AvatarMood } from '@/types/avatar'

interface UseConversationOptions {
  avatar: AvatarConfig
  onStateChange?: (state: ConversationState) => void
}

interface UseConversationResult {
  state: ConversationState
  messages: Message[]
  error: string | null
  audioEnergy: number
  isRecording: boolean
  isSupported: boolean
  interimTranscript: string
  startListening: () => Promise<void>
  stopListening: () => Promise<void>
  stopSpeaking: () => void
}

/**
 * Main conversation orchestration hook
 * Coordinates the full voice conversation flow:
 * IDLE -> LISTENING -> THINKING -> SPEAKING -> IDLE
 * 
 * Uses Web Speech API for both speech recognition AND text-to-speech
 * This is completely FREE and requires no API keys!
 */
export function useConversation({ avatar, onStateChange }: UseConversationOptions): UseConversationResult {
  const [state, setState] = useState<ConversationState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)

  // Web Speech API for speech recognition (free)
  const { 
    isListening, 
    isSupported: speechRecognitionSupported, 
    interimTranscript,
    startListening: startWebSpeech, 
    stopListening: stopWebSpeech, 
    error: speechError 
  } = useWebSpeech()
  
  // Browser TTS for speech synthesis (free)
  const { 
    audioEnergy, 
    isSupported: browserTTSSupported,
    speak: browserSpeak, 
    stop: stopBrowserTTS, 
    error: ttsError 
  } = useBrowserTTS()
  
  const isSupported = speechRecognitionSupported && browserTTSSupported

  // Refs for tracking state during async operations
  const isProcessingRef = useRef(false)

  // Update state and notify listener
  const updateState = useCallback((newState: ConversationState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  // Add message to history
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, message])
    return message
  }, [])

  /**
   * Start listening to user voice input using Web Speech API
   */
  const startListening = useCallback(async () => {
    if (isProcessingRef.current || state === 'listening') return

    try {
      setError(null)
      updateState('listening')
      startWebSpeech()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start listening')
      updateState('idle')
    }
  }, [state, startWebSpeech, updateState])

  /**
   * Stop listening and process the conversation
   * Pipeline: Web Speech Recognition -> Chat API -> Browser TTS
   */
  const stopListening = useCallback(async () => {
    if (!isListening || isProcessingRef.current) return

    isProcessingRef.current = true

    try {
      // Stop Web Speech recognition and get transcript
      const transcript = await stopWebSpeech()
      
      if (!transcript || transcript.trim().length === 0) {
        setError('No speech detected. Please try again.')
        updateState('idle')
        isProcessingRef.current = false
        return
      }

      // Move to thinking state
      updateState('thinking')

      // Add user message
      addMessage('user', transcript)

      // Get avatar mood (default to happy)
      const mood = avatar.mood || 'happy'

      // Step 2: Get AI response from chat API (uses Vercel AI Gateway)
      const aiResponse = await generateResponse(
        [...messages, { id: '', role: 'user' as const, content: transcript, timestamp: Date.now() }],
        mood
      )

      if (!aiResponse) {
        setError('Failed to generate response. Please try again.')
        updateState('idle')
        isProcessingRef.current = false
        return
      }

      // Add assistant message
      addMessage('assistant', aiResponse)

      // Step 3: Use browser TTS for speech synthesis (FREE!)
      updateState('speaking')
      await browserSpeak(aiResponse, mood)

      updateState('idle')
    } catch (err) {
      console.error('Conversation error:', err instanceof Error ? err.message : err)
      setError(err instanceof Error ? err.message : 'Conversation failed')
      updateState('idle')
    } finally {
      isProcessingRef.current = false
    }
  }, [isListening, stopWebSpeech, messages, avatar, addMessage, updateState, browserSpeak])

  /**
   * Stop the avatar from speaking
   */
  const stopSpeaking = useCallback(() => {
    stopBrowserTTS()
    updateState('idle')
  }, [stopBrowserTTS, updateState])

  // Combine errors from different sources
  const combinedError = error || speechError || ttsError

  return {
    state,
    messages,
    error: combinedError,
    audioEnergy,
    isRecording: isListening,
    isSupported,
    interimTranscript,
    startListening,
    stopListening,
    stopSpeaking,
  }
}

/**
 * Helper: Generate AI response using the Chat API
 * Uses Vercel AI Gateway (no user API key required)
 */
async function generateResponse(
  messages: Message[],
  mood: AvatarMood
): Promise<string | null> {
  try {
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        mood,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Chat API error:', errorData)
      throw new Error(errorData.error || 'Chat failed')
    }

    const data = await response.json()
    return data.message
  } catch (err) {
    console.error('Chat error:', err)
    return null
  }
}
