'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// Type definitions for Web Speech API
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

interface UseWebSpeechResult {
  isListening: boolean
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
  startListening: () => void
  stopListening: () => Promise<string>
}

/**
 * Hook for using the browser's Web Speech API for speech recognition
 * This is a free alternative to OpenAI Whisper that works directly in the browser
 */
export function useWebSpeech(): UseWebSpeechResult {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const finalTranscriptRef = useRef('')
  const resolveRef = useRef<((value: string) => void) | null>(null)

  // Check for Web Speech API support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-ES'  // Spanish (Spain)
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
      finalTranscriptRef.current = ''
      setTranscript('')
      setInterimTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }

      finalTranscriptRef.current = final
      setTranscript(final.trim())
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      const errorEvent = event as Event & { error: string }
      if (errorEvent.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (errorEvent.error === 'audio-capture') {
        setError('No microphone found. Please connect a microphone.')
      } else if (errorEvent.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow access.')
      } else {
        setError(`Speech recognition error: ${errorEvent.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      // Resolve the promise with the final transcript
      if (resolveRef.current) {
        resolveRef.current(finalTranscriptRef.current.trim())
        resolveRef.current = null
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return

    setError(null)
    finalTranscriptRef.current = ''
    setTranscript('')
    setInterimTranscript('')

    try {
      recognitionRef.current.start()
    } catch (err) {
      // Recognition might already be started
      console.error('Failed to start speech recognition:', err)
    }
  }, [isListening])

  const stopListening = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!recognitionRef.current || !isListening) {
        resolve(finalTranscriptRef.current.trim())
        return
      }

      resolveRef.current = resolve
      recognitionRef.current.stop()
    })
  }, [isListening])

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
  }
}
