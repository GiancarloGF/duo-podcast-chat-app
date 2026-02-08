import { z } from 'zod';

export const feedbackSchema = z.object({
  score: z.number().min(0).max(100).describe('Puntuación de 0 a 100'),
  analysis: z
    .string()
    .describe('Visión general de la calidad de la traducción (en Español)'),
  detailedAnalysis: z.object({
    grammar: z
      .string()
      .describe('Feedback específico sobre gramática (en Español)'),
    vocabulary: z
      .string()
      .describe(
        'Feedback sobre elección de palabras y vocabulario (en Español)'
      ),
    construction: z
      .string()
      .describe('Feedback sobre estructura y flujo de la oración (en Español)'),
  }),
  phrasalVerbs: z.object({
    relevant: z.boolean().describe('True si se podrían usar phrasal verbs'),
    suggestions: z
      .array(z.string())
      .describe(
        'Lista de alternativas con phrasal verbs y su explicación en Español'
      ),
  }),
  suggestions: z.array(z.string()).describe('Tips accionables'),
  differences: z.string().optional().describe('Diferencias clave'),
});

export type FeedbackSchemaType = z.infer<typeof feedbackSchema>;
