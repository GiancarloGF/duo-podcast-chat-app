import { z } from 'zod';

export const practiceExercisePhrasalVerbInputSchema = z.object({
  id: z.string().min(1),
  phrasalVerb: z.string().min(1),
  meaning: z.string().min(1),
  definition: z.string().min(1),
  example: z.string().min(1),
});

export const practiceExerciseItemSchema = z.object({
  pvId: z.string().min(1),
  phrasalVerb: z.string().min(1),
  sentenceMarkdown: z.string().min(1),
  meanings: z.array(z.string().min(1)).length(3),
  correctMeaningIndex: z.number().int().min(0).max(2),
});

export const practiceExerciseSchema = z.object({
  exerciseType: z.literal('read_and_mark_meaning'),
  title: z.string().min(1),
  instructions: z.string().min(1),
  items: z.array(practiceExerciseItemSchema).min(1).max(5),
});

export const practiceExerciseRequestSchema = z.object({
  phrasalVerbs: z.array(practiceExercisePhrasalVerbInputSchema).min(1).max(5),
});

export type PracticeExercisePhrasalVerbInput = z.infer<
  typeof practiceExercisePhrasalVerbInputSchema
>;
export type PracticeExerciseItem = z.infer<typeof practiceExerciseItemSchema>;
export type PracticeExercise = z.infer<typeof practiceExerciseSchema>;
