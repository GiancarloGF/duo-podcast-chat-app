'use server';

import { GeminiService } from '@/lib/gemini-service';

export async function getWordDefinition(word: string, sentence: string) {
  try {
    const data = await GeminiService.getDetailedWordDefinition(word, sentence);
    return { success: true, data };
  } catch (error) {
    console.error('Error in getWordDefinition action:', error);
    return { success: false, error: 'Failed to fetch definition' };
  }
}
