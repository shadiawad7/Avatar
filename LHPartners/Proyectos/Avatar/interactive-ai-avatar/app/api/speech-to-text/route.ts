/**
 * Speech-to-Text API Route
 * Converts user audio input to text using OpenAI Whisper
 * 
 * Accepts: multipart/form-data with audio file
 * Returns: { text: string }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return Response.json({ error: 'No audio file provided' }, { status: 400 })
    }

    console.log('[v0] Audio file received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    })

    // Create FormData for OpenAI API
    const openaiFormData = new FormData()
    openaiFormData.append('file', audioFile, 'audio.webm')
    openaiFormData.append('model', 'whisper-1')

    console.log('[v0] Sending to Whisper API')

    // Direct fetch to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[v0] Whisper API error:', response.status, errorText)
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`)
    }

    const transcription = await response.json()
    console.log('[v0] Transcription result:', transcription.text)

    return Response.json({
      text: transcription.text,
    })
  } catch (error) {
    console.error('[v0] Speech-to-text error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json(
      { error: 'Failed to transcribe audio', details: errorMessage },
      { status: 500 }
    )
  }
}
