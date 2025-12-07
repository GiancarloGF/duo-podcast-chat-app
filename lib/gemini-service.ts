import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { feedbackSchema, type TranslationFeedback } from './feedback-schema';

export class GeminiService {
  private static client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  static async getTranslationFeedback(
    originalText: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string
  ): Promise<TranslationFeedback> {
    const prompt = this.buildPrompt(
      originalText,
      officialTranslation,
      userTranslation,
      context
    );

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(feedbackSchema),
      },
    });

    if (!response.text) {
      console.error(
        '[GeminiService:getTranslationFeedback] No response received from Gemini'
      );
      throw new Error('No response received from Gemini');
    }

    const feedback = feedbackSchema.parse(JSON.parse(response.text));
    return feedback;
  }

  private static buildPrompt(
    originalText: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string
  ): string {
    return `Eres un experto evaluador de traducciones español-inglés. Tu tarea es analizar la calidad de una traducción proporcionada por un estudiante.

TEXTO ORIGINAL (ESPAÑOL):
"${originalText}"

TRADUCCIÓN OFICIAL (REFERENCIA):
"${officialTranslation}"

TRADUCCIÓN DEL ESTUDIANTE:
"${userTranslation}"
${context ? `\nCONTEXTO ADICIONAL:\n${context}` : ''}

INSTRUCCIONES DE EVALUACIÓN:

1. **Puntuación (score)**: Asigna un valor de 0-100 considerando:
   - Precisión semántica (¿transmite el mismo significado?)
   - Naturalidad en inglés (¿suena natural para un nativo?)
   - Gramática y sintaxis
   - Vocabulario apropiado
   - Fidelidad al texto original

2. **Análisis (analysis)**: Proporciona un análisis breve que incluya:
   - Fortalezas de la traducción del estudiante
   - Áreas de mejora identificadas
   - Comparación con la traducción oficial
   - Evaluación de naturalidad y fluidez

3. **Diferencias (differences)**: Identifica las diferencias clave entre ambas traducciones:
   - Diferencias de vocabulario
   - Diferencias estructurales o gramaticales
   - Diferencias de registro o tono
   - Impacto de estas diferencias en el significado

4. **Sugerencias (suggestions)**: Proporciona 2-3 sugerencias concretas y accionables:
   - Cada sugerencia debe ser específica y práctica
   - Enfócate en los errores más importantes
   - Incluye alternativas o correcciones cuando sea posible

IMPORTANTE: Sé constructivo y educativo. El objetivo es ayudar al estudiante a mejorar.`;
  }
}
