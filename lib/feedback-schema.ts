import { z } from 'zod';

export const feedbackSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe('Puntuación de 0 a 100 que evalúa la calidad de la traducción'),
  analysis: z
    .string()
    .describe('Análisis detallado de la calidad de la traducción del usuario'),
  differences: z
    .string()
    .describe('Diferencias clave entre la traducción oficial y la del usuario'),
  suggestions: z
    .array(z.string())
    .describe('Lista de 2-3 sugerencias específicas de mejora'),
});

export type TranslationFeedback = z.infer<typeof feedbackSchema>;
