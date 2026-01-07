import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
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
3. **Análisis Detallado** - IMPORTANTE: Solo menciona las secciones donde hay errores. Si no hay error en una categoría, deja ese campo vacío (""):
   - **Gramática**: Menciona SOLO si hay errores gramaticales específicos.
   - **Vocabulario**: Menciona SOLO si hay errores o mejoras en la elección de palabras.
   - **Construcción**: Menciona SOLO si hay errores en la estructura de la oración.
4. **Phrasal Verbs**:
   - ¡IMPORTANTE! Si se puede usar phrasal verbs para sonar más natural, sugíérelo.
   - Da ejemplos concretos.
5. **Sugerencias**: Tips cortos para mejorar.

Usa Markdown para resaltar palabras clave (**palabra**).
Tu respuesta debe seguir estrictamente el esquema JSON proporcionado.`;
  }

  static async getWordDefinition(
    word: string,
    sentence: string
  ): Promise<{ meaning: string; example: string }> {
    const prompt = `Define the word "${word}" based on its usage in this sentence: "${sentence}".
Provide:
1. "meaning": A concise definition fitting this specific context.
2. "example": A short usage example of the word in a similar context.
Output JSON format.`;

    const schema = z.object({
      meaning: z.string(),
      example: z.string(),
    });

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(schema),
      },
    });

    if (!response.text) {
      throw new Error('No response from Gemini for definition');
    }

    return schema.parse(JSON.parse(response.text));
  }
  static async getDetailedWordDefinition(
    word: string,
    sentence: string
  ): Promise<{
    definedWord: string;
    partOfSpeech: string;
    synonyms: string[];
    typeOf: string;
    definition: string;
    otherExamples: string[];
    summary: string;
  }> {
    const schema = z.object({
      definedWord: z
        .string()
        .describe('The word or phrasal verb being defined'),
      partOfSpeech: z.string(),
      synonyms: z.array(z.string()),
      typeOf: z.string().describe('Category or classification of the word'),
      definition: z.string().describe('Precise definition in context'),
      otherExamples: z
        .array(z.string())
        .describe('2-3 other sentences using this word/phrase'),
      summary: z
        .string()
        .describe('Explanation of usage in this specific context'),
    });

    const prompt = `Analyze the word "${word}" in the context of the sentence: "${sentence}".
    
    Tasks:
    1. Identify if "${word}" is part of a phrasal verb or compound word in this specific sentence (e.g. if word is "get" and sentence is "I get up early", the target is "get up").
    2. Define that target word/phrase specifically for this context.
    3. Provide synonyms, part of speech, and a "typeOf" classification.
    4. Provide 2-3 other example sentences.
    5. Write a summary explaining why this specific definition applies here.
    
    Return pure JSON matching the schema.`;

    const response = await this.client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(schema),
      },
    });

    if (!response.text) {
      throw new Error('No response from Gemini for detailed definition');
    }

    return schema.parse(JSON.parse(response.text));
  }
}
