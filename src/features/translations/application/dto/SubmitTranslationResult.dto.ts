import type { TranslationFeedback } from '@/features/translations/domain/entities/TranslationFeedback';

export interface SubmitTranslationResultDto {
  success: boolean;
  feedback?: TranslationFeedback;
  newIndex?: number;
  message?: string;
  error?: string;
}
