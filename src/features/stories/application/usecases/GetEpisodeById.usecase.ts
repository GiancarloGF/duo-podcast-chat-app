import type { EpisodeRepository } from '@/features/stories/domain/repositories/EpisodeRepository.interface';
import type { Episode } from '@/features/stories/domain/entities/Episode';

export async function getEpisodeById(
  repository: EpisodeRepository,
  episodeId: string
): Promise<Episode | null> {
  return repository.getEpisodeById(episodeId);
}
