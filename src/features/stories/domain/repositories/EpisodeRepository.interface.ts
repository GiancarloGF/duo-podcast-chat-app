import type { Episode } from '../entities/Episode';

export interface EpisodeRepository {
  getStories(): Promise<Episode[]>;
  getEpisodeById(id: string): Promise<Episode | null>;
}
