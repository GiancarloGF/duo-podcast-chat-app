import type { TranslationFeedback } from '@/features/stories/domain/entities/TranslationFeedback';
import type { TranslationFeedbackService } from '@/features/stories/domain/repositories/TranslationFeedbackService.interface';
import type { SubmitTranslationResultDto } from '../dto/SubmitTranslationResult.dto';

export async function submitTranslation(
  feedbackService: TranslationFeedbackService,
  userTranslation: string,
  officialTranslation: string,
  originalContent: string
): Promise<SubmitTranslationResultDto> {
  try {
    const iaFeedback = await feedbackService.getFeedback(
      originalContent,
      officialTranslation,
      userTranslation
    );

    const feedback: TranslationFeedback = {
      ...iaFeedback,
      userTranslation,
      officialTranslation,
      originalContent,
    };

    return { success: true, feedback };
  } catch (error) {
    console.error('Error in submitTranslation:', error);
    return { success: false, error: 'Internal Server Error' };
  }
}
