import { z } from 'zod';

export const practiceExercisePhrasalVerbInputSchema = z.object({
  id: z.string().min(1),
  phrasalVerb: z.string().min(1),
  meaning: z.string().min(1),
  definition: z.string().min(1),
  example: z.string().min(1),
});

export const practiceExerciseTypeSchema = z.enum([
  'read_and_mark_meaning',
  'mark_sentences_correct',
  'fill_in_gaps_drag_drop',
]);

export const readAndMarkMeaningItemSchema = z.object({
  pvId: z.string().min(1),
  phrasalVerb: z.string().min(1),
  sentenceMarkdown: z.string().min(1),
  meanings: z.array(z.string().min(1)).length(3),
  correctMeaningIndex: z.number().int().min(0).max(2),
});

export const readAndMarkMeaningExerciseSchema = z.object({
  exerciseType: z.literal('read_and_mark_meaning'),
  title: z.string().min(1),
  instructions: z.string().min(1),
  items: z.array(readAndMarkMeaningItemSchema).min(1).max(5),
});

export const markSentencesCorrectItemSchema = z.object({
  pvId: z.string().min(1),
  phrasalVerb: z.string().min(1),
  firstSentenceMarkdown: z.string().min(1),
  secondSentenceMarkdown: z.string().min(1),
  correctSentenceIndex: z.number().int().min(0).max(1),
});

export const markSentencesCorrectExerciseSchema = z.object({
  exerciseType: z.literal('mark_sentences_correct'),
  title: z.string().min(1),
  instructions: z.string().min(1),
  items: z.array(markSentencesCorrectItemSchema).min(1).max(5),
});

export const fillInGapsDragDropItemSchema = z.object({
  pvId: z.string().min(1),
  phrasalVerb: z.string().min(1),
  sentencePrefix: z.string().min(1),
  sentenceSuffix: z.string().min(1),
  correctWord: z.string().min(1),
});

export const fillInGapsDragDropExerciseSchema = z.object({
  exerciseType: z.literal('fill_in_gaps_drag_drop'),
  title: z.string().min(1),
  instructions: z.string().min(1),
  items: z.array(fillInGapsDragDropItemSchema).min(1).max(5),
  wordBank: z.array(z.string().min(1)).min(1).max(5),
});

export const practiceExerciseSchema = z.discriminatedUnion('exerciseType', [
  readAndMarkMeaningExerciseSchema,
  markSentencesCorrectExerciseSchema,
  fillInGapsDragDropExerciseSchema,
]);

export const practiceExerciseRequestSchema = z.object({
  phrasalVerbs: z.array(practiceExercisePhrasalVerbInputSchema).min(1).max(5),
});

export type PracticeExercisePhrasalVerbInput = z.infer<
  typeof practiceExercisePhrasalVerbInputSchema
>;
export type PracticeExerciseType = z.infer<typeof practiceExerciseTypeSchema>;
export type ReadAndMarkMeaningExercise = z.infer<
  typeof readAndMarkMeaningExerciseSchema
>;
export type MarkSentencesCorrectExercise = z.infer<
  typeof markSentencesCorrectExerciseSchema
>;
export type FillInGapsDragDropExercise = z.infer<
  typeof fillInGapsDragDropExerciseSchema
>;
export type PracticeExercise = z.infer<typeof practiceExerciseSchema>;
