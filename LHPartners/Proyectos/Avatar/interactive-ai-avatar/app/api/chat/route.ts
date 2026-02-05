import { PERSONALITIES, PersonalityId } from '@/lib/personalities'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: Message[]
  personalityId?: PersonalityId
}

function extractAssistantText(data: any): string {
  const content = data?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join(' ')
      .trim()
  }
  const refusal = data?.choices?.[0]?.message?.refusal
  if (typeof refusal === 'string') return refusal.trim()
  return ''
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest
    const { messages, personalityId = 'alegra' } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages are required' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: 'OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      )
    }

    const personality = PERSONALITIES[personalityId] ?? PERSONALITIES.alegra
    const model = process.env.OPENAI_CHAT_MODEL || 'gpt-5-mini'

    const voiceBehaviorPrompt = `
Contexto: conversacion por voz para demo publica.
Objetivo: sonar humano, natural y fluido.
Reglas globales:
- Respuestas breves para voz: 1-3 frases.
- Evita tono de asistente robotico.
- Evita monologos largos y repeticion literal del usuario.
- Termina con pregunta breve cuando ayude a continuar.
- No uses markdown, listas ni emojis.
- Responde en el idioma del usuario salvo que pida cambiar.
`

    const openaiMessages: Message[] = [
      { role: 'system', content: `${voiceBehaviorPrompt}\n${personality.systemPrompt}` },
      ...messages,
    ]

    const callOpenAI = async (chatModel: string) => {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: chatModel,
          messages: openaiMessages,
          max_completion_tokens: 180,
        }),
      })
      return res
    }

    let openaiRes = await callOpenAI(model)
    if (!openaiRes.ok) {
      const errorText = await openaiRes.text()
      return Response.json(
        { error: 'OpenAI chat request failed', details: errorText },
        { status: openaiRes.status }
      )
    }

    let data = await openaiRes.json()
    let message = extractAssistantText(data)

    // Fallback defensivo: algunos modelos pueden devolver contenido vacio.
    if (!message && model !== 'gpt-4o-mini') {
      openaiRes = await callOpenAI('gpt-4o-mini')
      if (openaiRes.ok) {
        data = await openaiRes.json()
        message = extractAssistantText(data)
      }
    }

    if (!message) {
      return Response.json(
        { error: 'Model returned an empty response', details: JSON.stringify(data).slice(0, 600) },
        { status: 500 }
      )
    }

    return Response.json({ message })
  } catch (error) {
    console.error('Chat error:', error)
    const details = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: 'Failed to generate response', details }, { status: 500 })
  }
}
