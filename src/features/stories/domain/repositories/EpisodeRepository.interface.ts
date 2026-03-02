import type { Episode } from '../entities/Episode';

export interface EpisodeRepository {
  getStories(): Promise<Episode[]>;
  getByNumbers(numbers: number[]): Promise<Episode[]>;
  getMaxEpisodeNumber(): Promise<number | null>;
  getEpisodeNumberById(id: string): Promise<number | null>;
  getNumbersByIds(ids: string[]): Promise<Array<{ id: string; number: number }>>;
  getEpisodeById(id: string): Promise<Episode | null>;
}
