import type { UserProgressRepository } from '@/features/stories/domain/repositories/UserProgressRepository.interface';

export interface StartEpisodeResult {
  progressId: string;
}

export async function startEpisode(
  repository: UserProgressRepository,
  userId: string,
  episodeId: string
): Promise<StartEpisodeResult> {
  const progress = await repository.create({
    userId,
    episodeId,
    currentMessageIndex: 0,
    status: 'started',
    interactions: [],
    lastActiveAt: new Date(),
  });
  if (!progress.id) {
    throw new Error('Failed to create user progress');
  }
  return { progressId: progress.id };
}
