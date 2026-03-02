import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import type { EpisodeRepository } from '@/features/stories/domain/repositories/EpisodeRepository.interface';
import type { UserProgressRepository } from '@/features/stories/domain/repositories/UserProgressRepository.interface';
import {
  getCurrentEpisodeNumber,
  getHighestConsecutiveCompleted,
} from '@/features/stories/application/utils/storySequence';

export interface StorySequenceWindowResult {
  previousEpisode: Episode | null;
  currentEpisode: Episode | null;
  nextEpisode: Episode | null;
  currentProgress: UserProgress | null;
  hasFinishedCatalog: boolean;
  hasAnyEpisodes: boolean;
}

export async function getStorySequenceWindow(
  episodeRepository: EpisodeRepository,
  progressRepository: UserProgressRepository,
  userId: string
): Promise<StorySequenceWindowResult> {
  const progressList = await progressRepository.getAllByUserId(userId);
  const completedProgress = progressList.filter(
    (progress) => progress.status === 'completed'
  );
  const startedProgress = progressList.filter(
    (progress) => progress.status === 'started'
  );

  const [maxEpisodeNumber, progressEpisodeNumbersById] = await Promise.all([
    episodeRepository.getMaxEpisodeNumber(),
    episodeRepository.getNumbersByIds(
      progressList.map((progress) => progress.episodeId)
    ),
  ]);

  if (maxEpisodeNumber === null) {
    return {
      previousEpisode: null,
      currentEpisode: null,
      nextEpisode: null,
      currentProgress: null,
      hasFinishedCatalog: false,
      hasAnyEpisodes: false,
    };
  }

  const episodeNumbersById = new Map(
    progressEpisodeNumbersById.map((episode) => [episode.id, episode.number] as const)
  );
  const completedEpisodeNumbersById = completedProgress
    .map((progress) => ({
      id: progress.episodeId,
      number: episodeNumbersById.get(progress.episodeId),
    }))
    .filter(
      (episode): episode is { id: string; number: number } =>
        episode.number !== undefined
    );

  if (completedEpisodeNumbersById.length !== completedProgress.length) {
    console.warn('Some completed story progress entries could not be mapped to episodes', {
      userId,
      completedProgressCount: completedProgress.length,
      mappedCompletedCount: completedEpisodeNumbersById.length,
    });
  }

  const completedEpisodeNumbers = new Set<number>(
    completedEpisodeNumbersById.map((episode) => episode.number)
  );
  const highestCompletedNumber =
    getHighestConsecutiveCompleted(completedEpisodeNumbers);
  const currentEpisodeNumber = getCurrentEpisodeNumber(completedEpisodeNumbers);

  if (currentEpisodeNumber > maxEpisodeNumber) {
    const [previousEpisode] = await episodeRepository.getByNumbers([
      highestCompletedNumber,
    ]);

    return {
      previousEpisode: previousEpisode ?? null,
      currentEpisode: null,
      nextEpisode: null,
      currentProgress: null,
      hasFinishedCatalog: true,
      hasAnyEpisodes: true,
    };
  }

  const requestedNumbers = [
    highestCompletedNumber > 0 ? highestCompletedNumber : null,
    currentEpisodeNumber,
    currentEpisodeNumber + 1 <= maxEpisodeNumber ? currentEpisodeNumber + 1 : null,
  ].filter((value): value is number => value !== null);

  const episodes = await episodeRepository.getByNumbers(requestedNumbers);
  const episodeByNumber = new Map(
    episodes.map((episode) => [episode.number, episode] as const)
  );

  const previousEpisode =
    highestCompletedNumber > 0
      ? (episodeByNumber.get(highestCompletedNumber) ?? null)
      : null;
  const currentEpisode = episodeByNumber.get(currentEpisodeNumber) ?? null;
  const nextEpisode = episodeByNumber.get(currentEpisodeNumber + 1) ?? null;

  if (!currentEpisode) {
    console.warn('Current story episode could not be resolved from Mongo', {
      userId,
      currentEpisodeNumber,
      maxEpisodeNumber,
      mappedCompletedCount: completedEpisodeNumbersById.length,
    });
  }

  const currentProgress =
    startedProgress.find(
      (progress) =>
        episodeNumbersById.get(progress.episodeId) === currentEpisodeNumber
    ) ?? null;

  return {
    previousEpisode,
    currentEpisode,
    nextEpisode,
    currentProgress,
    hasFinishedCatalog: false,
    hasAnyEpisodes: true,
  };
}
