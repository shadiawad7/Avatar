import { generateText } from "ai"
import { PERSONALITIES, PersonalityId } from "@/lib/personalities"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: Message[]
  personalityId?: PersonalityId
}

/**
 * Chat API Route
 *
 * Generates AI responses based on a fixed personality.
 * Each personality has:
 * - a strict role
 * - hard behavioral limits
 * - a dedicated system prompt
 *
 * This replaces the old "mood-based" system.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequest
    const { messages, personalityId = "alegra" } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Messages are required" },
        { status: 400 }
      )
    }

    // Resolve personality (fallback to Alegra)
    const personality =
      PERSONALITIES[personalityId] ?? PERSONALITIES.alegra

    // Build final message list with strict system prompt
    const fullMessages: Message[] = [
      {
        role: "system",
        content: personality.systemPrompt,
      },
      ...messages,
    ]

    // Generate response
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      messages: fullMessages,
      maxOutputTokens: 200, // concise for voice
      temperature: 0.7, // stable, human-like
    })

    return Response.json({ message: text })
  } catch (error) {
    console.error("Chat error:", error)

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("429")
    ) {
      return Response.json(
        {
          error:
            "API quota exceeded. The AI chat feature is temporarily unavailable.",
        },
        { status: 429 }
      )
    }

    return Response.json(
      {
        error:
          "Failed to generate response. Please try again.",
      },
      { status: 500 }
    )
  }
}
