'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/features/auth/presentation/actions';
import { getStories } from '@/features/stories/application/usecases/GetStories.usecase';
import { getEpisodeById } from '@/features/stories/application/usecases/GetEpisodeById.usecase';
import { MongoEpisodeRepository } from '@/features/stories/infrastructure/repositories/MongoEpisodeRepository';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { TranslationFeedback } from '@/features/stories/domain/entities/TranslationFeedback';
import type { Interaction } from '@/features/stories/domain/entities/Interaction';
import { submitTranslation as submitTranslationUc } from '@/features/stories/application/usecases/SubmitTranslation.usecase';
import { updateProgress as updateProgressUc } from '@/features/stories/application/usecases/UpdateProgress.usecase';
import { getUserProgress as getUserProgressUc } from '@/features/stories/application/usecases/GetUserProgress.usecase';
import { getAllUserProgress as getAllUserProgressUc } from '@/features/stories/application/usecases/GetAllUserProgress.usecase';
import { startEpisode as startEpisodeUc } from '@/features/stories/application/usecases/StartEpisode.usecase';
import { getWordDefinition as getWordDefinitionUc } from '@/features/stories/application/usecases/GetWordDefinition.usecase';
import { getStorySequenceWindow as getStorySequenceWindowUc } from '@/features/stories/application/usecases/GetStorySequenceWindow.usecase';
import { GeminiTranslationService } from '@/features/stories/infrastructure/services/GeminiTranslationService';
import { MongoUserProgressRepository } from '@/features/stories/infrastructure/repositories/MongoUserProgressRepository';
import dbConnect from '@/shared/infrastructure/database/mongo/connection';
import { getSavedWordModel } from '@/shared/infrastructure/database/mongo/models/SavedWord';

const episodeRepo = new MongoEpisodeRepository();
const feedbackService = new GeminiTranslationService();
const progressRepo = new MongoUserProgressRepository();

async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
}

// Episodes
export async function getAllEpisodesAction(): Promise<Episode[]> {
  try {
    return getStories(episodeRepo);
  } catch (error) {
    console.error('Error al obtener los episodios:', error);
    throw new Error('Error al obtener los episodios: ' + error);
  }
}

export async function getEpisodeByIdAction(
  episodeId: string
): Promise<Episode | null> {
  try {
    return getEpisodeById(episodeRepo, episodeId);
  } catch (error) {
    console.error('Error fetching episode:', error);
    throw new Error('Error fetching episode: ' + error);
  }
}

// Progress & translations
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
  episodeId: string,
  newIndex: number,
  status: 'started' | 'completed' = 'started',
  interaction?: Interaction
): Promise<UpdateProgressResult> {
  const userId = await requireCurrentUserId();
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
  userProgressId: string
) {
  const userId = await requireCurrentUserId();
  return getUserProgressUc(progressRepo, userId, userProgressId);
}

export async function getAllUserProgress() {
  const userId = await requireCurrentUserId();
  return getAllUserProgressUc(progressRepo, userId);
}

export async function getStorySequenceWindowAction() {
  const userId = await requireCurrentUserId();
  return getStorySequenceWindowUc(episodeRepo, progressRepo, userId);
}

export async function startChatByEpisode(episodeId: string) {
  const userId = await requireCurrentUserId();
  const { currentEpisode } = await getStorySequenceWindowUc(
    episodeRepo,
    progressRepo,
    userId
  );

  if (!currentEpisode) {
    throw new Error('No hay episodios disponibles para iniciar');
  }

  if (currentEpisode.id !== episodeId) {
    throw new Error('Solo puedes iniciar el episodio actual');
  }

  const { progressId } = await startEpisodeUc(progressRepo, userId, episodeId);
  revalidatePath('/');
  revalidatePath('/stories');
  redirect(`/stories/chat/${progressId}`);
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
