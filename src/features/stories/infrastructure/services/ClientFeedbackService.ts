import type { TranslationFeedback } from '@/features/stories/domain/entities/TranslationFeedback';

/**
 * Cliente para obtener feedback de traducción vía API (llamadas desde el navegador).
 * La lógica de negocio está en GeminiTranslationService en el servidor.
 */
export class ClientFeedbackService {
  static async getFeedback(
    originalText: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string
  ): Promise<TranslationFeedback | null> {
    try {
      const response = await fetch('/api/get-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalText,
          officialTranslation,
          userTranslation,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get feedback');
      }

      return data.feedback as TranslationFeedback;
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return null;
    }
  }

  static async getFeedbackWithRetry(
    originalText: string,
    officialTranslation: string,
    userTranslation: string,
    context?: string,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<TranslationFeedback | null> {
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const feedback = await this.getFeedback(
          originalText,
          officialTranslation,
          userTranslation,
          context
        );

        if (feedback) return feedback;
      } catch (error) {
        if (attempt === maxRetries) {
          console.error('Max retries reached');
          throw error;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    return null;
  }
}
