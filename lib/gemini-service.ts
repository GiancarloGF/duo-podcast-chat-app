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
    return `Actúa como un profesor de inglés oach amigable y experto. Tu objetivo es dar feedback a un estudiante sobre su traducción de español a inglés.

CONTEXTO:
Original (ES): "${originalText}"
Referencia (EN): "${officialTranslation}"
Estudiante (EN): "${userTranslation}"
${context ? `Contexto extra: ${context}` : ''}

INSTRUCCIONES CLAVE:
1. **Puntuación (0-100)**: Sé justo pero motivador.
2. **Análisis (Breve y Natural)**:
   - Usa un tono conversacional, informal y directo (como "¡Buen trabajo!", "Ojo con esto").
   - **IMPORTANTE**: Usa formato Markdown para resaltar palabras clave o frases (ej. **palabra importante**).
   - Sé conciso. No des explicaciones teóricas largas, ve al grano sobre qué suena natural y qué no.
3. **Diferencias**: Menciona solo las diferencias que realmente cambian el sentido o la naturalidad.
4. **Sugerencias (Máx 2)**: Consejos cortos y accionables para sonar más nativo.

Tu respuesta debe ser estructurada en JSON según el esquema, pero el contenido de texto debe sentirse humano y fácil de leer.`;
  }
}
