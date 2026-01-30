'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { AvatarMood } from '@/types/avatar'

interface UseBrowserTTSResult {
  isSpeaking: boolean
  audioEnergy: number
  error: string | null
  isSupported: boolean
  isReady: boolean
  speak: (text: string, mood: AvatarMood) => Promise<void>
  stop: () => void
}

// Voice settings per mood for browser speech synthesis
// Each mood has DISTINCT characteristics for rate and pitch
const MOOD_VOICE_SETTINGS: Record<AvatarMood, { 
  rate: number
  pitch: number
  volume: number
  // Voice name preferences (in priority order)
  voicePreferences: string[]
}> = {
  happy: { 
    rate: 1.12,      // Upbeat, energetic
    pitch: 1.2,      // Higher pitch, bright
    volume: 1.0,
    voicePreferences: ['Google español', 'Monica', 'Paulina', 'Jorge']
  },
  angry: { 
    rate: 1.18,      // Faster, more intense
    pitch: 0.75,     // Lower, deeper, more aggressive
    volume: 1.0,
    voicePreferences: ['Google español', 'Jorge', 'Diego', 'Carlos']
  },
  sad: { 
    rate: 0.82,      // Slower, more deliberate
    pitch: 0.85,     // Lower, softer
    volume: 0.88,
    voicePreferences: ['Google español', 'Monica', 'Paulina', 'Laura']
  },
}

/**
 * Hook for browser-based text-to-speech with simulated audio energy
 * Uses the Web Speech Synthesis API (free, no API key required)
 * 
 * Features:
 * - Pre-loads voices on initialization to avoid first-audio glitches
 * - Mood-specific voice selection with distinct rate/pitch settings
 * - Simulated audio energy for lip-sync animation
 */
export function useBrowserTTS(): UseBrowserTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioEnergy, setAudioEnergy] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isReady, setIsReady] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const energyTargetRef = useRef(0)
  const currentEnergyRef = useRef(0)
  const isSpeakingRef = useRef(false)
  const voicesCacheRef = useRef<SpeechSynthesisVoice[]>([])
  const spanishVoicesRef = useRef<SpeechSynthesisVoice[]>([])

  // Keep ref in sync with state
  useEffect(() => {
    isSpeakingRef.current = isSpeaking
  }, [isSpeaking])

  // Initialize and pre-load voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false)
      return
    }

    setIsSupported(true)

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      voicesCacheRef.current = voices
      
      // Filter Spanish voices
      spanishVoicesRef.current = voices.filter(v => 
        v.lang.startsWith('es')
      )
      
      if (voices.length > 0) {
        setIsReady(true)
        
        // Warm up the TTS engine with a silent utterance
        // This prevents the first real utterance from having glitches
        const warmup = new SpeechSynthesisUtterance('')
        warmup.volume = 0
        warmup.rate = 1
        if (spanishVoicesRef.current.length > 0) {
          warmup.voice = spanishVoicesRef.current[0]
        }
        window.speechSynthesis.speak(warmup)
        window.speechSynthesis.cancel()
      }
    }

    // Load voices immediately if available
    loadVoices()

    // Also listen for voice list changes (Chrome loads asynchronously)
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Simulate natural-looking audio energy for lip-sync
  const simulateEnergy = useCallback(() => {
    if (!isSpeakingRef.current) {
      setAudioEnergy(0)
      return
    }

    // Randomly vary the target energy to create natural mouth movement
    if (Math.random() < 0.15) {
      energyTargetRef.current = 0.3 + Math.random() * 0.6
    }

    // Smooth transition to target
    const smoothingFactor = 0.25
    currentEnergyRef.current += (energyTargetRef.current - currentEnergyRef.current) * smoothingFactor

    // Add small random variation for more natural look
    const variation = (Math.random() - 0.5) * 0.1
    const finalEnergy = Math.max(0, Math.min(1, currentEnergyRef.current + variation))

    setAudioEnergy(finalEnergy)
    animationFrameRef.current = requestAnimationFrame(simulateEnergy)
  }, [])

  // Start energy simulation when speaking
  useEffect(() => {
    if (isSpeaking) {
      animationFrameRef.current = requestAnimationFrame(simulateEnergy)
    } else {
      setAudioEnergy(0)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpeaking, simulateEnergy])

  /**
   * Find the best voice for the given mood
   * Prioritizes Spanish voices and tries to match voice preferences
   * Note: This is NOT a useCallback - it reads from refs directly
   */
  function findVoiceForMood(mood: AvatarMood): SpeechSynthesisVoice | null {
    const settings = MOOD_VOICE_SETTINGS[mood]
    const spanishVoices = spanishVoicesRef.current

    if (spanishVoices.length === 0) {
      // Fallback to any available voice
      return voicesCacheRef.current[0] || null
    }

    // Try to find a preferred voice for this mood
    for (const pref of settings.voicePreferences) {
      const match = spanishVoices.find(v => 
        v.name.toLowerCase().includes(pref.toLowerCase())
      )
      if (match) return match
    }

    // Fallback: use mood-based index to ensure different moods get different voices
    const moodIndex: Record<AvatarMood, number> = {
      happy: 0,
      angry: 1,
      sad: 2,
    }
    
    const idx = moodIndex[mood] % spanishVoices.length
    return spanishVoices[idx]
  }

  const speak = useCallback(async (text: string, mood: AvatarMood): Promise<void> => {
    if (!('speechSynthesis' in window)) {
      setError('Speech synthesis not supported in this browser')
      return
    }

    return new Promise((resolve) => {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        // Small delay to ensure cancel completes
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(text)
          utteranceRef.current = utterance

          // Apply mood-specific settings
          const settings = MOOD_VOICE_SETTINGS[mood]
          utterance.rate = settings.rate
          utterance.pitch = settings.pitch
          utterance.volume = settings.volume
          utterance.lang = 'es-ES'

          // Select the best voice for this mood
          const voice = findVoiceForMood(mood)
          if (voice) {
            utterance.voice = voice
          }

          utterance.onstart = () => {
            setIsSpeaking(true)
            setError(null)
            energyTargetRef.current = 0.5
            currentEnergyRef.current = 0
          }

          utterance.onend = () => {
            setIsSpeaking(false)
            setAudioEnergy(0)
            energyTargetRef.current = 0
            currentEnergyRef.current = 0
            resolve()
          }

          utterance.onerror = (event) => {
            // Ignore 'interrupted' and 'canceled' errors
            if (event.error === 'interrupted' || event.error === 'canceled') {
              setIsSpeaking(false)
              setAudioEnergy(0)
              resolve()
              return
            }
            setError(`Speech error: ${event.error}`)
            setIsSpeaking(false)
            resolve()
          }

          window.speechSynthesis.speak(utterance)
        }, 50)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to speak')
        setIsSpeaking(false)
        resolve()
      }
    })
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setAudioEnergy(0)
    energyTargetRef.current = 0
    currentEnergyRef.current = 0
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    isSpeaking,
    audioEnergy,
    error,
    isSupported,
    isReady,
    speak,
    stop,
  }
}
