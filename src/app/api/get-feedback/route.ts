import { GeminiTranslationService } from '@/features/translations/infrastructure/services/GeminiTranslationService';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { originalText, officialTranslation, userTranslation, context } =
      body;

    if (!originalText || !officialTranslation || !userTranslation) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const service = new GeminiTranslationService();
    const feedback = await service.getFeedback(
      originalText,
      officialTranslation,
      userTranslation,
      context
    );

    return Response.json(
      { success: true, feedback },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting feedback:', error);
    return Response.json(
      {
        error: 'Failed to generate feedback',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
