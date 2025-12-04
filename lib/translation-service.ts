export interface TranslationValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class TranslationValidator {
  // Check if translation is empty or whitespace only
  static isEmpty(translation: string): boolean {
    return translation.trim().length === 0
  }

  // Check minimum length (at least 3 characters for meaningful translation)
  static isMinimumLength(translation: string, minLength = 3): boolean {
    return translation.trim().length >= minLength
  }

  // Check if translation looks like English (basic heuristic)
  static appearsToBeEnglish(translation: string): boolean {
    // Common English words for validation
    const commonEnglishWords = [
      "the",
      "is",
      "at",
      "which",
      "on",
      "a",
      "and",
      "or",
      "but",
      "in",
      "to",
      "for",
      "of",
      "that",
      "this",
      "was",
      "be",
      "are",
      "been",
      "were",
    ]

    const words = translation.toLowerCase().split(/\s+/)
    const englishWordCount = words.filter((word) => commonEnglishWords.includes(word)).length

    // At least 20% of words should be common English words (very lenient)
    return englishWordCount > 0 || words.length <= 2
  }

  // Main validation function
  static validate(translation: string): TranslationValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if empty
    if (this.isEmpty(translation)) {
      errors.push("La traducción no puede estar vacía")
    }

    // Check minimum length
    if (!this.isMinimumLength(translation)) {
      errors.push("La traducción debe tener al menos 3 caracteres")
    }

    // Check if looks like English
    if (this.isMinimumLength(translation) && !this.appearsToBeEnglish(translation)) {
      warnings.push("Asegúrate de que escribiste la traducción en inglés")
    }

    // Check for common Spanish patterns (warning)
    if (this.hasSpanishPatterns(translation)) {
      warnings.push("Parece que usaste español. Recuerda traducir al inglés")
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Detect if translation contains Spanish text
  private static hasSpanishPatterns(text: string): boolean {
    // Spanish-specific letters and patterns
    const spanishPatterns = /[áéíóúñü]|(?:ción|sión|dad|mente)$/
    return spanishPatterns.test(text)
  }
}

export interface TranslationRequest {
  originalEs: string
  officialTranslation: string
  userTranslation: string
  context?: string
}

export class TranslationService {
  // Format translation request for AI processing
  static formatRequestForAI(request: TranslationRequest): string {
    return `
Evalúa esta traducción del español al inglés:

TEXTO ORIGINAL (ESPAÑOL):
"${request.originalEs}"

TRADUCCIÓN OFICIAL (ESPERADA):
"${request.officialTranslation}"

TRADUCCIÓN DEL USUARIO:
"${request.userTranslation}"

Por favor proporciona:
1. Una puntuación de 0 a 100
2. Análisis detallado de la calidad de la traducción
3. Las diferencias clave entre la traducción oficial y la del usuario
4. 2-3 sugerencias específicas de mejora

Responde en formato JSON con esta estructura:
{
  "score": <número 0-100>,
  "analysis": "<análisis detallado>",
  "differences": "<diferencias clave>",
  "suggestions": ["<sugerencia 1>", "<sugerencia 2>", "<sugerencia 3>"]
}
`
  }

  // Parse AI response
  static parseAIResponse(response: string): {
    score: number
    analysis: string
    differences: string
    suggestions: string[]
  } | null {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null

      const parsed = JSON.parse(jsonMatch[0])
      return {
        score: Math.min(100, Math.max(0, parsed.score || 0)),
        analysis: parsed.analysis || "",
        differences: parsed.differences || "",
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      }
    } catch (error) {
      console.error("Error parsing AI response:", error)
      return null
    }
  }
}
