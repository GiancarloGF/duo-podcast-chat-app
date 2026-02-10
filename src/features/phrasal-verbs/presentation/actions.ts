'use server';

import { z } from 'zod';
import { GeminiPracticeExerciseService } from '@/features/phrasal-verbs/infrastructure/services/GeminiPracticeExerciseService';
import {
  practiceExerciseRequestSchema,
  type PracticeExercise,
  type PracticeExercisePhrasalVerbInput,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';

const generateExerciseService = new GeminiPracticeExerciseService();
const AI_GENERATION_TIMEOUT_MS = 25000;

const generateReadAndMarkMeaningInputSchema = z.object({
  phrasalVerbs: practiceExerciseRequestSchema.shape.phrasalVerbs,
});

export interface GenerateReadAndMarkMeaningExerciseResult {
  success: boolean;
  exercise?: PracticeExercise;
  error?: string;
  details?: string;
}

export async function generateReadAndMarkMeaningExerciseAction(
  phrasalVerbs: PracticeExercisePhrasalVerbInput[]
): Promise<GenerateReadAndMarkMeaningExerciseResult> {
  try {
    console.info('[generateReadAndMarkMeaningExerciseAction] start', {
      pvCount: phrasalVerbs.length,
      pvIds: phrasalVerbs.map((pv) => pv.id),
    });

    if (!process.env.GEMINI_API_KEY) {
      console.error('[generateReadAndMarkMeaningExerciseAction] Missing GEMINI_API_KEY');
      return {
        success: false,
        error: 'Missing GEMINI_API_KEY on server environment.',
      };
    }

    const parsedInput = generateReadAndMarkMeaningInputSchema.parse({
      phrasalVerbs,
    });

    const exercise = await Promise.race([
      generateExerciseService.generateReadAndMarkMeaningExercise(
        parsedInput.phrasalVerbs
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('The AI request timed out.'));
        }, AI_GENERATION_TIMEOUT_MS);
      }),
    ]);

    console.info('[generateReadAndMarkMeaningExerciseAction] success', {
      itemCount: exercise.items.length,
      exerciseType: exercise.exerciseType,
    });

    return {
      success: true,
      exercise,
    };
  } catch (error) {
    console.error(
      '[generateReadAndMarkMeaningExerciseAction] Failed to generate exercise',
      {
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
