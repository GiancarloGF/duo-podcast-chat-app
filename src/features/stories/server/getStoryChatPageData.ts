import 'server-only';

import { getCurrentUserId } from '@/features/auth/presentation/actions';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import { getEpisodeById } from '@/features/stories/application/usecases/GetEpisodeById.usecase';
import { getStorySequenceWindow } from '@/features/stories/application/usecases/GetStorySequenceWindow.usecase';
import { getUserProgress } from '@/features/stories/application/usecases/GetUserProgress.usecase';
import { MongoEpisodeRepository } from '@/features/stories/infrastructure/repositories/MongoEpisodeRepository';
import { MongoUserProgressRepository } from '@/features/stories/infrastructure/repositories/MongoUserProgressRepository';

interface StoryChatPageData {
  currentEpisode: Episode | null;
  episode: Episode | null;
  userProgress: UserProgress | null;
}

const episodeRepository = new MongoEpisodeRepository();
const progressRepository = new MongoUserProgressRepository();

export async function getStoryChatPageData(
  userProgressId: string,
): Promise<StoryChatPageData> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  const userProgress = await getUserProgress(progressRepository, userId, userProgressId);

  if (!userProgress) {
    return {
      currentEpisode: null,
      episode: null,
      userProgress: null,
    };
  }

  const [episode, storyWindow] = await Promise.all([
    getEpisodeById(episodeRepository, userProgress.episodeId),
    getStorySequenceWindow(episodeRepository, progressRepository, userId),
  ]);

  return {
    currentEpisode: storyWindow.currentEpisode,
    episode,
    userProgress,
  };
}
