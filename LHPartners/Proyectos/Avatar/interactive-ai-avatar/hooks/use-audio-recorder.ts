'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { getSupportedMimeType, checkAudioSupport } from '@/lib/audio-utils'

interface UseAudioRecorderResult {
  isRecording: boolean
  isSupported: boolean
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  audioBlob: Blob | null
}

/**
 * Hook for capturing microphone audio
 * Handles MediaRecorder setup, permissions, and audio capture
 */
export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Check for audio support on mount
  useEffect(() => {
    const support = checkAudioSupport()
    setIsSupported(support.supported)
    if (!support.supported) {
      setError(`Missing audio support: ${support.missing.join(', ')}`)
    }
  }, [])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser')
      return
    }

    try {
      setError(null)
      chunksRef.current = []

      // Request microphone permission and get stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Good for speech recognition
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      streamRef.current = stream

      // Create MediaRecorder with best supported format
      const mimeType = getSupportedMimeType()
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = () => {
        setError('Recording error occurred')
        setIsRecording(false)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone permission denied. Please allow microphone access.')
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.')
        } else {
          setError(`Failed to start recording: ${err.message}`)
        }
      }
      setIsRecording(false)
    }
  }, [isSupported])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        resolve(null)
        return
      }

      mediaRecorderRef.current.onstop = () => {
        // Combine all chunks into single blob
        const mimeType = getSupportedMimeType()
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setIsRecording(false)

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        resolve(blob)
      }

      mediaRecorderRef.current.stop()
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
    isRecording,
    isSupported,
    error,
    startRecording,
    stopRecording,
    audioBlob,
  }
}
