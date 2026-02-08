import type { TranslationFeedback } from '../entities/TranslationFeedback';

export interface TranslationFeedbackService {
  getFeedback(
    originalText: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string
  ): Promise<Omit<TranslationFeedback, 'userTranslation' | 'officialTranslation' | 'originalContent'>>;
}
