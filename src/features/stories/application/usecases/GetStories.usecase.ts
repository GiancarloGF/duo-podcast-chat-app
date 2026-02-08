import type { EpisodeRepository } from '@/features/stories/domain/repositories/EpisodeRepository.interface';
import type { Episode } from '@/features/stories/domain/entities/Episode';

export async function getStories(
  repository: EpisodeRepository
): Promise<Episode[]> {
  const episodes = await repository.getStories();
  return episodes.map((ep) => ({
    ...ep,
    messages: [], // List view does not need full messages
  }));
}
