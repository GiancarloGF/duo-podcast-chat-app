'use server';

import { z } from 'zod';
import { GeminiPracticeExerciseService } from '@/features/phrasal-verbs/infrastructure/services/GeminiPracticeExerciseService';
import {
  practiceExerciseTypeSchema,
  practiceExerciseRequestSchema,
  type PracticeExercise,
  type PracticeExerciseType,
  type PracticeExercisePhrasalVerbInput,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';

const generateExerciseService = new GeminiPracticeExerciseService();
const AI_GENERATION_TIMEOUT_MS = 25000;

const generatePracticeExerciseInputSchema = z.object({
  exerciseType: practiceExerciseTypeSchema,
  phrasalVerbs: practiceExerciseRequestSchema.shape.phrasalVerbs,
});

export interface GeneratePracticeExerciseResult {
  success: boolean;
  exercise?: PracticeExercise;
  error?: string;
  details?: string;
}

export async function generatePracticeExerciseAction(
  exerciseType: PracticeExerciseType,
  phrasalVerbs: PracticeExercisePhrasalVerbInput[]
): Promise<GeneratePracticeExerciseResult> {
  try {
    console.info('[generatePracticeExerciseAction] start', {
      exerciseType,
      pvCount: phrasalVerbs.length,
      pvIds: phrasalVerbs.map((pv) => pv.id),
    });

    if (!process.env.GEMINI_API_KEY) {
      console.error('[generatePracticeExerciseAction] Missing GEMINI_API_KEY');
      return {
        success: false,
        error: 'Missing GEMINI_API_KEY on server environment.',
      };
    }

    const parsedInput = generatePracticeExerciseInputSchema.parse({
      exerciseType,
      phrasalVerbs,
    });

    const exercise = await Promise.race([
      generateExerciseService.generateExercise(
        parsedInput.exerciseType,
        parsedInput.phrasalVerbs
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('The AI request timed out.'));
        }, AI_GENERATION_TIMEOUT_MS);
      }),
    ]);

    console.info('[generatePracticeExerciseAction] success', {
      requestedType: exerciseType,
      itemCount: exercise.items.length,
      exerciseType: exercise.exerciseType,
    });

    return {
      success: true,
      exercise,
    };
  } catch (error) {
    console.error(
      '[generatePracticeExerciseAction] Failed to generate exercise',
      {
        exerciseType,
        pvCount: phrasalVerbs.length,
        error,
      }
    );

    return {
      success: false,
      error: 'Failed to generate the exercise.',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
