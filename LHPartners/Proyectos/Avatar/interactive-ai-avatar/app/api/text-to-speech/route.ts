type TtsRequest = {
  text?: string
  personalityId?: string
}

const VOICE_BY_PERSONALITY: Record<'alegra' | 'empatico' | 'intenso', string> = {
  alegra: 'onyx',
  empatico: 'nova',
  intenso: 'onyx',
}

const STYLE_BY_PERSONALITY: Record<'alegra' | 'empatico' | 'intenso', string> = {
  alegra:
    'Voz masculina joven, calida y cercana. Espanol natural, ritmo humano con pausas, sin tono robotico. Sonrisa ligera al hablar.',
  empatico:
    'Voz femenina, calmada y docente. Espanol claro, pausas naturales, tono humano y suave, articulacion limpia.',
  intenso:
    'Voz masculina adulta, firme y segura. Espanol natural, directo, conversacional, con cadencia humana, sin sonar mecanico.',
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TtsRequest
    const text = body.text?.trim()
    const personalityId =
      body.personalityId === 'empatico' || body.personalityId === 'intenso'
        ? body.personalityId
        : 'alegra'

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: 'OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      )
    }

    const model = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts'

    const openaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice: VOICE_BY_PERSONALITY[personalityId],
        input: text,
        instructions: STYLE_BY_PERSONALITY[personalityId],
        response_format: 'mp3',
      }),
    })

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text()
      return Response.json(
        { error: 'Failed generating speech', details: errorText },
        { status: openaiRes.status }
      )
    }

    const audioBuffer = await openaiRes.arrayBuffer()
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('TTS error:', error)
    return Response.json({ error: 'Failed generating speech' }, { status: 500 })
  }
}
