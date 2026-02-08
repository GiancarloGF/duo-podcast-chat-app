'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/features/auth/presentation/actions';
import type { TranslationFeedback } from '@/features/translations/domain/entities/TranslationFeedback';
import type { Interaction } from '@/features/translations/domain/entities/Interaction';
import { submitTranslation as submitTranslationUc } from '@/features/translations/application/usecases/SubmitTranslation.usecase';
import { updateProgress as updateProgressUc } from '@/features/translations/application/usecases/UpdateProgress.usecase';
import { getUserProgress as getUserProgressUc } from '@/features/translations/application/usecases/GetUserProgress.usecase';
import { getAllUserProgress as getAllUserProgressUc } from '@/features/translations/application/usecases/GetAllUserProgress.usecase';
import { startEpisode as startEpisodeUc } from '@/features/translations/application/usecases/StartEpisode.usecase';
import { getWordDefinition as getWordDefinitionUc } from '@/features/translations/application/usecases/GetWordDefinition.usecase';
import { GeminiTranslationService } from '@/features/translations/infrastructure/services/GeminiTranslationService';
import { MongoUserProgressRepository } from '@/features/translations/infrastructure/repositories/MongoUserProgressRepository';
import dbConnect from '@/shared/infrastructure/database/mongo/connection';
import { getSavedWordModel } from '@/shared/infrastructure/database/mongo/models/SavedWord';

const feedbackService = new GeminiTranslationService();
const progressRepo = new MongoUserProgressRepository();

export interface SubmitTranslationResult {
  success: boolean;
  feedback?: TranslationFeedback;
  newIndex?: number;
  message?: string;
  error?: string;
}

export async function submitTranslation(
  userTranslation: string,
  officialTranslation: string,
  originalContent: string
): Promise<SubmitTranslationResult> {
  return submitTranslationUc(
    feedbackService,
    userTranslation,
    officialTranslation,
    originalContent
  );
}

export interface UpdateProgressResult {
  success: boolean;
  message?: string;
  newIndex?: number;
}

export async function updateProgress(
  userId: string,
  episodeId: string,
  newIndex: number,
  status: 'started' | 'completed' = 'started',
  interaction?: Interaction
): Promise<UpdateProgressResult> {
  return updateProgressUc(
    progressRepo,
    userId,
    episodeId,
    newIndex,
    status,
    interaction
  );
}

export async function getUserProgress(
  userId: string,
  userProgressId: string
) {
  return getUserProgressUc(progressRepo, userId, userProgressId);
}

export async function getAllUserProgress(userId: string) {
  return getAllUserProgressUc(progressRepo, userId);
}

export async function startChatByEpisode(episodeId: string) {
  const userId = await getCurrentUserId();
  const { progressId } = await startEpisodeUc(progressRepo, userId, episodeId);
  revalidatePath('/');
  redirect(`/chat/${progressId}`);
}

export async function getWordDefinition(word: string, sentence: string) {
  return getWordDefinitionUc(feedbackService, word, sentence);
}

export async function saveWord(word: string, sentence: string) {
  try {
    const userId = await getCurrentUserId();
    const aiResponse = await feedbackService.getWordDefinition(word, sentence);
    await dbConnect();
    const SavedWordModel = getSavedWordModel();
    const savedWord = await SavedWordModel.create({
      userId,
      word,
      originalSentence: sentence,
      meaning: aiResponse.meaning,
      example: aiResponse.example,
    });
    return { success: true, data: JSON.parse(JSON.stringify(savedWord)) };
  } catch (error) {
    console.error('Error saving word:', error);
    return { success: false, error: 'Failed to save word' };
  }
}
