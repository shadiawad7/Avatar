import { generateText } from 'ai'
import { MOOD_SYSTEM_PROMPTS } from '@/lib/avatar-config'
import type { AvatarMood } from '@/types/avatar'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: Message[]
  mood?: AvatarMood
}

/**
 * Chat API Route
 * Generates AI responses for the avatar conversation
 * Uses GPT-4 for natural, conversational responses
 * 
 * The response style adapts to the avatar's mood:
 * - Happy: Warm, upbeat, encouraging
 * - Angry: Direct, intense, brief
 * - Sad: Gentle, empathetic, supportive
 * 
 * Accepts: { messages: Message[], mood?: AvatarMood }
 * Returns: { message: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json() as ChatRequest
    const { messages, mood = 'happy' } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages are required' }, { status: 400 })
    }

    // Get mood-specific system prompt for distinct personality
    const systemPrompt = MOOD_SYSTEM_PROMPTS[mood] || MOOD_SYSTEM_PROMPTS.happy

    // Prepare messages with mood-specific system prompt
    const fullMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]

    // Adjust temperature based on mood
    // Happy/Angry: more expressive, Sad: more measured
    const temperatureMap: Record<AvatarMood, number> = {
      happy: 0.8,
      angry: 0.75,
      sad: 0.65,
    }

    // Generate response using AI SDK
    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      messages: fullMessages,
      maxTokens: 200, // Keep responses concise for voice
      temperature: temperatureMap[mood],
    })

    return Response.json({ message: text })
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for quota errors
    if (errorMessage.includes('quota') || errorMessage.includes('429')) {
      return Response.json(
        { error: 'API quota exceeded. The AI chat feature is temporarily unavailable.' },
        { status: 429 }
      )
    }
    
    return Response.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    )
  }
}
