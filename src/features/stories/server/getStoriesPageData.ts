import 'server-only';

import { getCurrentUserId } from '@/features/auth/presentation/actions';
import { getStorySequenceWindow } from '@/features/stories/application/usecases/GetStorySequenceWindow.usecase';
import type { StorySequenceWindowResult } from '@/features/stories/application/usecases/GetStorySequenceWindow.usecase';
import { MongoEpisodeRepository } from '@/features/stories/infrastructure/repositories/MongoEpisodeRepository';
import { MongoUserProgressRepository } from '@/features/stories/infrastructure/repositories/MongoUserProgressRepository';

const episodeRepository = new MongoEpisodeRepository();
const progressRepository = new MongoUserProgressRepository();

export async function getStoriesPageData(): Promise<StorySequenceWindowResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  return getStorySequenceWindow(episodeRepository, progressRepository, userId);
}
