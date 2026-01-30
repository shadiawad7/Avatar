'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseVoiceActivityOptions {
  /** Silence duration (ms) before considering speech ended */
  silenceTimeout?: number
  /** Volume threshold (0-1) to consider as speech */
  volumeThreshold?: number
  /** Callback when speech starts */
  onSpeechStart?: () => void
  /** Callback when speech ends after silence */
  onSpeechEnd?: () => void
}

interface UseVoiceActivityResult {
  isListening: boolean
  isSpeaking: boolean
  volume: number
  error: string | null
  isSupported: boolean
  start: () => Promise<void>
  stop: () => void
}

/**
 * Voice Activity Detection (VAD) hook
 * Detects when the user starts and stops speaking using audio volume analysis
 * 
 * Uses Web Audio API to analyze microphone input and detect speech/silence
 */
export function useVoiceActivity({
  silenceTimeout = 1500,
  volumeThreshold = 0.015,
  onSpeechStart,
  onSpeechEnd,
}: UseVoiceActivityOptions = {}): UseVoiceActivityResult {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const wasSpeakingRef = useRef(false)
  const hasStartedSpeakingRef = useRef(false)

  // Check support on mount
  useEffect(() => {
    const supported = !!(
      typeof window !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia &&
      (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    )
    setIsSupported(supported)
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [])

  // Analyze audio volume
  const analyzeVolume = useCallback(() => {
    if (!analyserRef.current || !isListening) return

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    // Calculate RMS volume
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / dataArray.length)
    setVolume(rms)

    const isCurrentlySpeaking = rms > volumeThreshold

    if (isCurrentlySpeaking) {
      // User is speaking
      if (!wasSpeakingRef.current) {
        // Speech just started
        wasSpeakingRef.current = true
        setIsSpeaking(true)
        
        if (!hasStartedSpeakingRef.current) {
          hasStartedSpeakingRef.current = true
          onSpeechStart?.()
        }
      }
      
      // Clear any pending silence timer
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
    } else {
      // Silence detected
      if (wasSpeakingRef.current && hasStartedSpeakingRef.current) {
        // User was speaking and now silent - start silence timer
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            // Silence timeout reached - speech ended
            wasSpeakingRef.current = false
            hasStartedSpeakingRef.current = false
            setIsSpeaking(false)
            onSpeechEnd?.()
          }, silenceTimeout)
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(analyzeVolume)
  }, [isListening, volumeThreshold, silenceTimeout, onSpeechStart, onSpeechEnd])

  // Start listening
  const start = useCallback(async () => {
    if (isListening) return

    try {
      setError(null)
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      })
      streamRef.current = stream

      // Create audio context and analyser
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.8
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Reset state
      wasSpeakingRef.current = false
      hasStartedSpeakingRef.current = false
      setIsSpeaking(false)
      setIsListening(true)

      // Start volume analysis
      animationFrameRef.current = requestAnimationFrame(analyzeVolume)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone'
      if (message.includes('Permission denied') || message.includes('NotAllowedError')) {
        setError('Permiso de microfono denegado. Por favor permite el acceso.')
      } else {
        setError(message)
      }
      cleanup()
    }
  }, [isListening, analyzeVolume, cleanup])

  // Stop listening
  const stop = useCallback(() => {
    setIsListening(false)
    setIsSpeaking(false)
    setVolume(0)
    wasSpeakingRef.current = false
    hasStartedSpeakingRef.current = false
    cleanup()
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isListening,
    isSpeaking,
    volume,
    error,
    isSupported,
    start,
    stop,
  }
}
