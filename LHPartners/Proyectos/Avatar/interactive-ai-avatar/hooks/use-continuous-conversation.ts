'use client'

import { useState, useRef, useCallback } from 'react'
import type { AvatarConfig } from '@/types/avatar'
import type { ConversationState } from '@/types/conversation'

/* =======================
   TIPOS
======================= */

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type UseContinuousConversationOptions = {
  avatar: AvatarConfig
  personalityId: string
  silenceTimeout?: number
}

type UseContinuousConversationReturn = {
  state: ConversationState
  error: string | null
  audioEnergy: number
  isSupported: boolean
  isPaused: boolean
  interimTranscript: string
  start: () => Promise<void>
  pause: () => void
  resume: () => Promise<void>
  stopSpeaking: () => void
  resetConversation: () => void
}

/* =======================
   HOOK
======================= */

export function useContinuousConversation(
  options: UseContinuousConversationOptions
): UseContinuousConversationReturn {
  const { personalityId, silenceTimeout = 1800 } = options

  const [state, setState] = useState<ConversationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioEnergy] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')

  const messagesRef = useRef<Message[]>([])
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition)

  /* =======================
     UTILIDADES
  ======================= */

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const resetConversation = useCallback(() => {
    messagesRef.current = []
    setInterimTranscript('')
    setState('idle')
    setError(null)
  }, [])

  /* =======================
     BACKEND
  ======================= */

  const sendToBackend = async (userText: string) => {
    try {
      setState('thinking')

      messagesRef.current.push({
        role: 'user',
        content: userText,
      })

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesRef.current,
          personalityId,
        }),
      })

      if (!res.ok) {
        throw new Error('Chat API error')
      }

      const data = await res.json()

      messagesRef.current.push({
        role: 'assistant',
        content: data.message,
      })

      speakResponse(data.message)
    } catch (err) {
      console.error(err)
      setError('Error al generar respuesta')
      setState('idle')
    }
  }

  /* =======================
     TEXT TO SPEECH
  ======================= */

  const speakResponse = (text: string) => {
    if (!window.speechSynthesis) return

    setState('speaking')

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'es-ES'

    utterance.onend = () => {
      setState('listening')
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setState('idle')
  }

  /* =======================
     SPEECH RECOGNITION
  ======================= */

  const startRecognition = () => {
    if (!isSupported) return

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setState('listening')
    }

    recognition.onresult = (event: any) => {
      clearSilenceTimer()

      let interim = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          interim += transcript
        }
      }

      setInterimTranscript(interim)

      if (finalText) {
        setInterimTranscript('')
        silenceTimerRef.current = setTimeout(() => {
          sendToBackend(finalText)
        }, silenceTimeout)
      }
    }

    recognition.onerror = () => {
      setError('Error de reconocimiento de voz')
      setState('idle')
    }

    recognition.start()
    recognitionRef.current = recognition
  }

  /* =======================
     CONTROLES
  ======================= */

  const start = async () => {
    if (!isSupported) return
    setIsPaused(false)
    startRecognition()
  }

  const pause = () => {
    recognitionRef.current?.stop()
    setIsPaused(true)
    setState('idle')
  }

  const resume = async () => {
    if (!isSupported) return
    setIsPaused(false)
    startRecognition()
  }

  /* =======================
     RETURN
  ======================= */

  return {
    state,
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
