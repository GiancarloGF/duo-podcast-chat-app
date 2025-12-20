'use server';

import { GeminiService } from '../gemini-service';
import { TranslationFeedback } from '../types';

interface SubmitTranslationResult {
  success: boolean;
  // isCorrect?: boolean;
  feedback?: TranslationFeedback;
  newIndex?: number;
  // streakUpdated?: boolean;
  message?: string;
  error?: string;
}

export async function submitTranslation(
  userTranslation: string,
  officialTranslation: string,
  originalContent: string
): Promise<SubmitTranslationResult> {
  try {
    // Call Gemini API with structured outputs
    const iaFeedback = await GeminiService.getTranslationFeedback(
      originalContent,
      officialTranslation,
      userTranslation
    );

    if (!iaFeedback) {
      return {
        success: false,
        message: 'Error al obtener feedback de la IA.',
      };
    }

    const feedback: TranslationFeedback = {
      ...iaFeedback,
      userTranslation,
      officialTranslation,
      originalContent,
    };

    return {
      success: true,
      feedback: feedback,
    };
  } catch (error) {
    console.error('Error in submitTranslation:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}
