import { generateText } from "ai"
import { TranslationService } from "@/lib/translation-service"

export const maxDuration = 30 // Vercel serverless max timeout

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { originalEs, officialTranslation, userTranslation, context } = body

    if (!originalEs || !officialTranslation || !userTranslation) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Prepare the prompt for Gemini
    const prompt = TranslationService.formatRequestForAI({
      originalEs,
      officialTranslation,
      userTranslation,
      context,
    })

    // Call Gemini via AI SDK
    const { text } = await generateText({
      model: "openai/gpt-4o-mini", // Using Vercel AI Gateway which supports multiple models
      prompt,
      temperature: 0.7,
      maxTokens: 500,
    })

    // Parse the AI response
    const feedback = TranslationService.parseAIResponse(text)

    if (!feedback) {
      return Response.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    return Response.json(
      {
        success: true,
        feedback: {
          score: feedback.score,
          analysis: feedback.analysis,
          differences: feedback.differences,
          suggestions: feedback.suggestions,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error getting feedback:", error)
    return Response.json(
      {
        error: "Failed to generate feedback",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
