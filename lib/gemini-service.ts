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
    return `Actúa como un profesor de inglés coach amigable y experto. Tu objetivo es dar feedback a un estudiante sobre su traducción de español a inglés.

CONTEXTO:
Original (ES): "${originalText}"
Referencia (EN): "${officialTranslation}"
Estudiante (EN): "${userTranslation}"
${context ? `Contexto extra: ${context}` : ''}

INSTRUCCIONES CLAVE:
1. **Puntuación (0-100)**: Sé justo pero motivador.
2. **Análisis General**: Breve resumen del desempeño.
3. **Análisis Detallado**:
   - **Gramática**: Errores gramaticales específicos.
   - **Vocabulario**: Elección de palabras.
   - **Construcción**: Estructura de la oración.
4. **Phrasal Verbs**:
   - ¡IMPORTANTE! Si se puede usar un phrasal verb para sonar más natural, sugíérelo.
   - Da ejemplos concretos.
5. **Sugerencias**: Tips cortos para mejorar.

Usa Markdown para resaltar palabras clave (**palabra**).
Tu respuesta debe seguir estrictamente el esquema JSON proporcionado.`;
  }
}
