import type { TranslationFeedback } from '@/features/stories/domain/entities/TranslationFeedback';

export interface SubmitTranslationResultDto {
  success: boolean;
  feedback?: TranslationFeedback;
  newIndex?: number;
  message?: string;
  error?: string;
}
