'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import type { AvatarConfig } from '@/types/avatar'
import type { ConversationState } from '@/types/conversation'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type UseContinuousConversationOptions = {
  avatar?: AvatarConfig
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

export function useContinuousConversation(
  options: UseContinuousConversationOptions
): UseContinuousConversationReturn {
  const { personalityId, silenceTimeout = 1300 } = options

  const [state, setState] = useState<ConversationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [audioEnergy, setAudioEnergy] = useState(0)
  const [isPaused, setIsPaused] = useState(true)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)

  const stateRef = useRef<ConversationState>('idle')
  const isPausedRef = useRef(true)
  const messagesRef = useRef<Message[]>([])
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const finalBufferRef = useRef('')
  const sendToBackendRef = useRef<(text: string) => Promise<void>>(async () => {})

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const energyRafRef = useRef<number | null>(null)
  const isStoppingRef = useRef(false)

  useEffect(() => {
    setIsSupported(
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    )
  }, [])

  const setConversationState = useCallback((next: ConversationState) => {
    stateRef.current = next
    setState(next)
  }, [])

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }, [])

  const stopEnergyLoop = useCallback(() => {
    if (energyRafRef.current) {
      cancelAnimationFrame(energyRafRef.current)
      energyRafRef.current = null
    }
    setAudioEnergy(0)
  }, [])

  const ensureAudioAnalyser = useCallback((audio: HTMLAudioElement) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    if (!sourceRef.current) {
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
    }
    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 1024
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
    }
  }, [])

  const startEnergyLoop = useCallback(() => {
    if (!analyserRef.current) return
    const analyser = analyserRef.current
    const data = new Uint8Array(analyser.fftSize)

    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const value = (data[i] - 128) / 128
        sum += value * value
      }
      const rms = Math.sqrt(sum / data.length)
      setAudioEnergy(Math.min(1, rms * 3))
      energyRafRef.current = requestAnimationFrame(tick)
    }

    tick()
  }, [])

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.stop()
      } catch {
        // noop
      }
      recognitionRef.current = null
    }
  }, [])

  const stopSpeaking = useCallback(() => {
    isStoppingRef.current = true
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
      try {
        audioRef.current.load()
      } catch {
        // noop
      }
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }
    stopEnergyLoop()
    if (!isPausedRef.current) {
      setConversationState('listening')
    } else {
      setConversationState('idle')
    }
    window.setTimeout(() => {
      isStoppingRef.current = false
    }, 0)
  }, [setConversationState, stopEnergyLoop])

  const startRecognition = useCallback(() => {
    if (!isSupported || recognitionRef.current || isPausedRef.current) return

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'es-ES'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      if (stateRef.current !== 'thinking' && stateRef.current !== 'speaking') {
        setConversationState('listening')
      }
    }

    recognition.onresult = (event: any) => {
      clearSilenceTimer()

      let interim = ''
      let finalChunk = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += `${transcript} `
        } else {
          interim += transcript
        }
      }

      if (finalChunk.trim()) {
        finalBufferRef.current += `${finalChunk.trim()} `
      }

      setInterimTranscript(interim)

      const buffered = finalBufferRef.current.trim()
      if (buffered.length >= 3 && !isPausedRef.current) {
        silenceTimerRef.current = setTimeout(async () => {
          const userText = finalBufferRef.current.trim()
          finalBufferRef.current = ''
          setInterimTranscript('')
          if (!userText || isPausedRef.current) return
          await sendToBackendRef.current(userText)
        }, silenceTimeout)
      }
    }

    recognition.onerror = () => {
      setError('Error de reconocimiento de voz')
    }

    recognition.onend = () => {
      recognitionRef.current = null
      if (!isPausedRef.current && stateRef.current !== 'speaking' && stateRef.current !== 'thinking') {
        window.setTimeout(() => startRecognition(), 120)
      }
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [clearSilenceTimer, isSupported, setConversationState, silenceTimeout])

  const speakResponse = useCallback(
    async (text: string) => {
      setConversationState('speaking')
      stopRecognition()
      clearSilenceTimer()
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, personalityId }),
      })

      if (!res.ok) {
        let details = ''
        try {
          const errBody = await res.json()
          details = errBody?.details || errBody?.error || ''
        } catch {
          details = await res.text()
        }
        throw new Error(
          details
            ? `TTS API error (${res.status}): ${details}`
            : `TTS API error (${res.status})`
        )
      }

      const blob = await res.blob()
      if (blob.size === 0) throw new Error('Empty TTS audio')
      const url = URL.createObjectURL(blob)

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
      audioUrlRef.current = url

      const audio = audioRef.current ?? new Audio()
      audioRef.current = audio
      ensureAudioAnalyser(audio)
      audio.src = url

      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      audio.onplay = () => {
        startEnergyLoop()
      }

      audio.onended = () => {
        if (isStoppingRef.current) return
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        stopEnergyLoop()
        if (!isPausedRef.current) {
          setConversationState('listening')
          startRecognition()
        } else {
          setConversationState('idle')
        }
      }

      audio.onerror = () => {
        if (isPausedRef.current || isStoppingRef.current) return
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current)
          audioUrlRef.current = null
        }
        stopEnergyLoop()
        setError('Error al reproducir audio')
        setConversationState('idle')
      }

      try {
        await audio.play()
      } catch {
        if (!isPausedRef.current && !isStoppingRef.current) {
          stopEnergyLoop()
          setError('Error al reproducir audio')
          setConversationState('idle')
        }
      }
    },
    [
      clearSilenceTimer,
      ensureAudioAnalyser,
      personalityId,
      setConversationState,
      startEnergyLoop,
      startRecognition,
      stopEnergyLoop,
      stopRecognition,
    ]
  )

  const sendToBackend = useCallback(
    async (userText: string) => {
      try {
        setConversationState('thinking')

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
          let details = ''
          try {
            const errBody = await res.json()
            details = errBody?.details || errBody?.error || ''
          } catch {
            details = await res.text()
          }
          throw new Error(
            details
              ? `Chat API error (${res.status}): ${details}`
              : `Chat API error (${res.status})`
          )
        }

        const data = await res.json()
        const reply = (data.message as string)?.trim()
        if (!reply) throw new Error('Empty model response')

        messagesRef.current.push({
          role: 'assistant',
          content: reply,
        })

        await speakResponse(reply)
      } catch (err) {
        console.error(err)
        setError('Error al generar respuesta')
        setConversationState('idle')
      }
    },
    [personalityId, setConversationState, speakResponse]
  )

  useEffect(() => {
    sendToBackendRef.current = sendToBackend
  }, [sendToBackend])

  const resetConversation = useCallback(() => {
    messagesRef.current = []
    finalBufferRef.current = ''
    setInterimTranscript('')
    setError(null)
  }, [])

  const start = useCallback(async () => {
    if (!isSupported) return
    setError(null)
    isPausedRef.current = false
    setIsPaused(false)
    startRecognition()
  }, [isSupported, startRecognition])

  const pause = useCallback(() => {
    isPausedRef.current = true
    setIsPaused(true)
    setError(null)
    clearSilenceTimer()
    finalBufferRef.current = ''
    setInterimTranscript('')
    stopRecognition()
    stopSpeaking()
    setConversationState('idle')
  }, [clearSilenceTimer, setConversationState, stopRecognition, stopSpeaking])

  const resume = useCallback(async () => {
    if (!isSupported) return
    setError(null)
    isPausedRef.current = false
    setIsPaused(false)
    finalBufferRef.current = ''
    setInterimTranscript('')
    startRecognition()
  }, [isSupported, startRecognition])

  useEffect(() => {
    return () => {
      clearSilenceTimer()
      stopRecognition()
      stopSpeaking()
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined)
      }
    }
  }, [clearSilenceTimer, stopRecognition, stopSpeaking])

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
