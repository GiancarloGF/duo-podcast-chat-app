'use server';

import { CONSTANTS } from '@/constants';
import dbConnect from '@/lib/db/conection';
import { getSavedWordModel } from '@/lib/db/models/SavedWord';
import { GeminiService } from '@/lib/gemini-service';
import { revalidatePath } from 'next/cache';

export async function saveWord(word: string, sentence: string) {
  try {
    // 1. Auth check (mock)
    const userId = CONSTANTS.FAKE_USER_ID;

    // 2. Generate definition from AI
    const aiResponse = await GeminiService.getWordDefinition(word, sentence);

    // 3. Save to DB
    await dbConnect();
    const SavedWordModel = getSavedWordModel();
    const savedWord = await SavedWordModel.create({
      userId,
      word,
      originalSentence: sentence,
      meaning: aiResponse.meaning,
      example: aiResponse.example,
    });

    // 4. Revalidate paths if necessary (e.g. if there's a list of saved words)
    // revalidatePath('/saved-words');

    return { success: true, data: JSON.parse(JSON.stringify(savedWord)) };
  } catch (error) {
    console.error('Error saving word:', error);
    return { success: false, error: 'Failed to save word' };
  }
}
