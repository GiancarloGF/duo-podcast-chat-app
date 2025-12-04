export interface AIFeedback {
  score: number
  analysis: string
  differences: string
  suggestions: string[]
}

export class AIService {
  static async getFeedback(
    originalEs: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string,
  ): Promise<AIFeedback | null> {
    try {
      const response = await fetch("/api/get-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalEs,
          officialTranslation,
          userTranslation,
          context,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get feedback")
      }

      return data.feedback
    } catch (error) {
      console.error("Error fetching feedback:", error)
      return null
    }
  }

  // Retry logic with exponential backoff
  static async getFeedbackWithRetry(
    originalEs: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string,
    maxRetries = 3,
    initialDelay = 1000,
  ): Promise<AIFeedback | null> {
    let delay = initialDelay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const feedback = await this.getFeedback(originalEs, officialTranslation, userTranslation, context)

        if (feedback) return feedback
      } catch (error) {
        if (attempt === maxRetries) {
          console.error("Max retries reached")
          throw error
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }

    return null
  }
}
