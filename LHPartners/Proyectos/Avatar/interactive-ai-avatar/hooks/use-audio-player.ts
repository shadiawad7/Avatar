'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createAudioContext, calculateAudioEnergy } from '@/lib/audio-utils'

interface UseAudioPlayerResult {
  isPlaying: boolean
  audioEnergy: number
  error: string | null
  playAudio: (audioUrl: string) => Promise<void>
  stopAudio: () => void
}

/**
 * Hook for playing audio with real-time energy analysis
 * Used for lip-sync animation - provides audio energy values during playback
 */
export function useAudioPlayer(): UseAudioPlayerResult {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioEnergy, setAudioEnergy] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const smoothedEnergyRef = useRef(0)

  // Analyze audio energy for lip-sync
  const analyzeEnergy = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      setAudioEnergy(0)
      return
    }

    const energyData = calculateAudioEnergy(analyserRef.current)
    
    // Apply smoothing for natural mouth movement
    const smoothingFactor = 0.4
    smoothedEnergyRef.current = smoothedEnergyRef.current + 
      (energyData.rms - smoothedEnergyRef.current) * smoothingFactor
    
    setAudioEnergy(smoothedEnergyRef.current)
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(analyzeEnergy)
  }, [isPlaying])

  const playAudio = useCallback(async (audioUrl: string) => {
    try {
      setError(null)
      
      // Stop any currently playing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause()
        audioElementRef.current = null
      }
      
      // Create or resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext()
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }

      // Create analyser node for energy detection
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.3

      // Use HTML Audio element for better compatibility
      const audio = new Audio(audioUrl)
      audio.crossOrigin = 'anonymous'
      audioElementRef.current = audio

      // Connect to analyser
      const source = audioContextRef.current.createMediaElementSource(audio)
      source.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)

      // Set up event handlers
      audio.onplay = () => {
        setIsPlaying(true)
        smoothedEnergyRef.current = 0
        analyzeEnergy()
      }

      audio.onended = () => {
        setIsPlaying(false)
        setAudioEnergy(0)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      audio.onerror = () => {
        setError('Failed to play audio')
        setIsPlaying(false)
      }

      // Start playback
      await audio.play()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to play audio')
      setIsPlaying(false)
    }
  }, [analyzeEnergy])

  const stopAudio = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      audioElementRef.current = null
    }
    
    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    setIsPlaying(false)
    setAudioEnergy(0)
    smoothedEnergyRef.current = 0
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopAudio])

  // Continue energy analysis when playing
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeEnergy)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, analyzeEnergy])

  return {
    isPlaying,
    audioEnergy,
    error,
    playAudio,
    stopAudio,
  }
}
