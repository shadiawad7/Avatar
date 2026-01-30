'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useBrowserTTS } from './use-browser-tts'
import type { ConversationState, Message } from '@/types/conversation'
import type { AvatarConfig, AvatarMood } from '@/types/avatar'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface UseContinuousConversationOptions {
  avatar: AvatarConfig
  silenceTimeout?: number
  minTranscriptLength?: number
  onStateChange?: (state: ConversationState) => void
}

interface UseContinuousConversationResult {
  state: ConversationState
  messages: Message[]
  error: string | null
  audioEnergy: number
  isSupported: boolean
  isPaused: boolean
  interimTranscript: string
  start: () => void
  pause: () => void
  resume: () => void
  stopSpeaking: () => void
  resetConversation: () => void
}

const MIN_TRANSCRIPT_LENGTH = 3

/**
 * Continuous voice conversation hook - FIXED VERSION
 * Uses non-continuous recognition to avoid accumulation bugs
 */
export function useContinuousConversation({
  avatar,
  silenceTimeout = 1500,
  minTranscriptLength = MIN_TRANSCRIPT_LENGTH,
  onStateChange,
}: UseContinuousConversationOptions): UseContinuousConversationResult {
  const [state, setState] = useState<ConversationState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)

  const { 
    audioEnergy, 
    isSupported: ttsSupported,
    speak: browserSpeak, 
    stop: stopBrowserTTS,
    isSpeaking: ttsSpeaking,
  } = useBrowserTTS()

  // Refs for mutable state
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const messagesRef = useRef<Message[]>([])
  const isPausedRef = useRef(true)
  const isProcessingRef = useRef(false)
  const isSpeakingRef = useRef(false)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const avatarRef = useRef(avatar)
  const avatarIdRef = useRef(avatar.id)
  const processedTranscriptRef = useRef<string | null>(null)

  
  // CRITICAL: Unique session ID to prevent processing old transcripts
  const sessionIdRef = useRef(0)
  const currentTranscriptRef = useRef('')

  // Keep refs in sync
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { isPausedRef.current = isPaused }, [isPaused])
  useEffect(() => { avatarRef.current = avatar }, [avatar])
  useEffect(() => { isSpeakingRef.current = ttsSpeaking }, [ttsSpeaking])

  // Reset on avatar change
  useEffect(() => {
    if (avatar.id !== avatarIdRef.current) {
      avatarIdRef.current = avatar.id
      setMessages([])
      messagesRef.current = []
      currentTranscriptRef.current = ''
      setInterimTranscript('')
      setError(null)
      sessionIdRef.current++
    }
  }, [avatar.id])

  // Check support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition && ttsSupported)
  }, [ttsSupported])

  const updateState = useCallback((newState: ConversationState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      role,
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => {
      const newMessages = [...prev, message]
      messagesRef.current = newMessages
      return newMessages
    })
    return message
  }, [])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  // Stop recognition completely
  const stopRecognition = useCallback(() => {
    clearSilenceTimer()
    if (recognitionRef.current) {
      try { 
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
        recognitionRef.current.abort() 
      } catch (e) { /* ignore */ }
      recognitionRef.current = null
    }
  }, [clearSilenceTimer])

  // Process and respond
  const processAndRespond = useCallback(async (transcript: string, sessionId: number) => {
    if (processedTranscriptRef.current === transcript) return
    processedTranscriptRef.current = transcript

    // CRITICAL: Check session ID to prevent stale processing
    if (sessionId !== sessionIdRef.current) {
      return
    }
    
    if (isProcessingRef.current || isSpeakingRef.current) {
      return
    }
    
    const cleanTranscript = transcript.trim()
    if (!cleanTranscript || cleanTranscript.length < minTranscriptLength) {
      // Restart listening
      if (!isPausedRef.current && sessionId === sessionIdRef.current) {
        startNewListeningSession()
      }
      return
    }

    // Lock processing
    isProcessingRef.current = true
    stopRecognition()
    updateState('thinking')
    setInterimTranscript('')
    currentTranscriptRef.current = ''

    try {
      const userMessage: Message = {
        id: 'temp-user',
        role: 'user',
        content: cleanTranscript,
        timestamp: Date.now(),
      }

      const mood = avatarRef.current.mood || 'happy'
      
      const context = [
        ...messagesRef.current
          .filter(m => m.role === 'assistant')
          .slice(-6),
        userMessage,
      ]

      addMessage('user', cleanTranscript)

      const response = await generateResponse(context, mood)


      // Check session again after async operation
      if (sessionId !== sessionIdRef.current) {
        isProcessingRef.current = false
        return
      }

      if (!response) {
        setError('No se pudo generar respuesta')
        isProcessingRef.current = false
        if (!isPausedRef.current) {
          updateState('listening')
          startNewListeningSession()
        } else {
          updateState('idle')
        }
        return
      }

      addMessage('assistant', response)

      // Speak
      updateState('speaking')
      isSpeakingRef.current = true
      
      await browserSpeak(response, mood)
      
      isSpeakingRef.current = false
      isProcessingRef.current = false

      // Check session after speaking
      if (sessionId !== sessionIdRef.current) {
        return
      }

      // Restart listening after speaking
      if (!isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 300))
        if (sessionId === sessionIdRef.current && !isPausedRef.current) {
          updateState('listening')
          startNewListeningSession()
        }
      } else {
        updateState('idle')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
      isSpeakingRef.current = false
      isProcessingRef.current = false
      
      if (!isPausedRef.current && sessionId === sessionIdRef.current) {
        updateState('listening')
        startNewListeningSession()
      } else {
        updateState('idle')
      }
    }
  }, [addMessage, browserSpeak, minTranscriptLength, stopRecognition, updateState])

  // Start a fresh listening session
  const startNewListeningSession = useCallback(() => {
    if (isProcessingRef.current || isSpeakingRef.current || isPausedRef.current) {
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    // Stop any existing
    stopRecognition()
    
    // Clear transcript for this new session
    currentTranscriptRef.current = ''
    setInterimTranscript('')

    processedTranscriptRef.current = null

    const currentSession = sessionIdRef.current
    const recognition = new SpeechRecognition()
    
    // NON-CONTINUOUS: One utterance at a time - prevents accumulation
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'es-ES'
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      if (currentSession !== sessionIdRef.current) return
      setError(null)
      currentTranscriptRef.current = ''
      if (!isProcessingRef.current && !isSpeakingRef.current) {
        updateState('listening')
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Ignore if session changed or processing
      if (currentSession !== sessionIdRef.current || isProcessingRef.current || isSpeakingRef.current) {
        return
      }

      let interim = ''
      let finalText = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      // Store current transcript
      if (finalText) {
        currentTranscriptRef.current = finalText
      }
      setInterimTranscript(interim || finalText || currentTranscriptRef.current)

      // Clear existing timer
      clearSilenceTimer()
      
      // Set timer for processing
      if ((finalText || currentTranscriptRef.current).length >= minTranscriptLength) {
        silenceTimerRef.current = setTimeout(() => {
          if (currentSession === sessionIdRef.current) {
            const toProcess = currentTranscriptRef.current || finalText
            if (toProcess && toProcess.trim().length >= minTranscriptLength) {
              processAndRespond(toProcess, currentSession)
            }
          }
        }, silenceTimeout)
      }
    }

    recognition.onerror = (event) => {
      const err = event as Event & { error: string }
      
      if (err.error === 'aborted' || currentSession !== sessionIdRef.current) {
        return
      }
      
      if (err.error === 'no-speech') {
        // No speech, restart
        if (!isPausedRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
          setTimeout(() => {
            if (currentSession === sessionIdRef.current) {
              startNewListeningSession()
            }
          }, 100)
        }
        return
      }
      
      if (err.error === 'audio-capture') {
        setError('No se encontro microfono')
      } else if (err.error === 'not-allowed') {
        setError('Permiso de microfono denegado')
      }
    }

    recognition.onend = () => {
      if (currentSession !== sessionIdRef.current) return
      
      // Auto-restart if not paused/processing/speaking
      if (!isPausedRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
        // Check if we have pending transcript to process
        const pending = currentTranscriptRef.current.trim()
        if (pending && pending.length >= minTranscriptLength && !silenceTimerRef.current) {
          // Process pending transcript
          processAndRespond(pending, currentSession)
        } else if (!silenceTimerRef.current) {
          // Otherwise restart listening
          setTimeout(() => {
            if (currentSession === sessionIdRef.current && !isPausedRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
              startNewListeningSession()
            }
          }, 100)
        }
      }
    }

    recognitionRef.current = recognition
    
    try {
      recognition.start()
    } catch (e) {
      setTimeout(() => {
        if (currentSession === sessionIdRef.current && !isPausedRef.current && !isProcessingRef.current && !isSpeakingRef.current) {
          startNewListeningSession()
        }
      }, 300)
    }
  }, [clearSilenceTimer, minTranscriptLength, processAndRespond, silenceTimeout, stopRecognition, updateState])

  // Public API
  const start = useCallback(() => {
    sessionIdRef.current++ // New session
    setError(null)
    isPausedRef.current = false
    setIsPaused(false)
    isProcessingRef.current = false
    isSpeakingRef.current = false
    currentTranscriptRef.current = ''
    setInterimTranscript('')
    startNewListeningSession()
  }, [startNewListeningSession])

  const pause = useCallback(() => {
    sessionIdRef.current++ // Invalidate current session
    isPausedRef.current = true
    setIsPaused(true)
    stopRecognition()
    stopBrowserTTS()
    isProcessingRef.current = false
    isSpeakingRef.current = false
    updateState('idle')
  }, [stopRecognition, stopBrowserTTS, updateState])

  const resume = useCallback(() => {
    sessionIdRef.current++ // New session
    setError(null)
    isPausedRef.current = false
    setIsPaused(false)
    isProcessingRef.current = false
    isSpeakingRef.current = false
    currentTranscriptRef.current = ''
    setInterimTranscript('')
    startNewListeningSession()
  }, [startNewListeningSession])

  const stopSpeaking = useCallback(() => {
    stopBrowserTTS()
    isSpeakingRef.current = false
    isProcessingRef.current = false
    
    if (!isPausedRef.current) {
      updateState('listening')
      setTimeout(() => startNewListeningSession(), 200)
    } else {
      updateState('idle')
    }
  }, [stopBrowserTTS, startNewListeningSession, updateState])

  const resetConversation = useCallback(() => {
    sessionIdRef.current++ // Invalidate all
    pause()
    setMessages([])
    messagesRef.current = []
    currentTranscriptRef.current = ''
    setInterimTranscript('')
    setError(null)
  }, [pause])

  // Cleanup
  useEffect(() => {
    return () => {
      stopRecognition()
      stopBrowserTTS()
    }
  }, [stopRecognition, stopBrowserTTS])

  return {
    state,
    messages,
    error,
    audioEnergy,
    isSupported,
    isPaused,
    interimTranscript,
    start,
    pause,
    resume,
    stopSpeaking,
    resetConversation,
  }
}

async function generateResponse(messages: Message[], mood: AvatarMood): Promise<string | null> {
  try {
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }))

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: apiMessages, mood }),
    })

    if (!response.ok) throw new Error('Chat failed')

    const data = await response.json()
    return data.message
  } catch (err) {
    console.error('Chat error:', err)
    return null
  }
}
