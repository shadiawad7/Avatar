// Web Audio API utilities for audio capture, playback, and energy analysis

import type { AudioEnergyData } from '@/types/conversation'

/**
 * Calculate audio energy (RMS) from an AnalyserNode's frequency data
 * Used for lip-sync animation based on audio volume
 */
export function calculateAudioEnergy(analyser: AnalyserNode): AudioEnergyData {
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteTimeDomainData(dataArray)

  // Calculate RMS (Root Mean Square) for overall volume
  let sum = 0
  let peak = 0
  for (let i = 0; i < dataArray.length; i++) {
    // Convert from 0-255 to -1 to 1
    const normalized = (dataArray[i] - 128) / 128
    sum += normalized * normalized
    peak = Math.max(peak, Math.abs(normalized))
  }

  const rms = Math.sqrt(sum / dataArray.length)

  return {
    rms: Math.min(rms * 2, 1), // Scale up and clamp
    peak: Math.min(peak, 1),
    smoothedRms: rms, // Will be smoothed by the hook
  }
}

/**
 * Convert Blob to base64 string for API transmission
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 audio data to a playable Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'audio/mp3'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

/**
 * Create an AudioContext (handles browser prefixes)
 */
export function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new AudioContextClass()
}

/**
 * Check if the browser supports the required audio APIs
 */
export function checkAudioSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = []

  if (!navigator.mediaDevices?.getUserMedia) {
    missing.push('getUserMedia')
  }
  if (!window.AudioContext && !(window as unknown as { webkitAudioContext: unknown }).webkitAudioContext) {
    missing.push('AudioContext')
  }
  if (!window.MediaRecorder) {
    missing.push('MediaRecorder')
  }

  return {
    supported: missing.length === 0,
    missing,
  }
}

/**
 * Get supported audio MIME types for recording
 */
export function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return 'audio/webm' // Fallback
}
