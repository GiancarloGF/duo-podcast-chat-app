'use server';

import { getStories } from '@/features/stories/application/usecases/GetStories.usecase';
import { getEpisodeById } from '@/features/stories/application/usecases/GetEpisodeById.usecase';
import { MongoEpisodeRepository } from '@/features/stories/infrastructure/repositories/MongoEpisodeRepository';
import type { Episode } from '@/features/stories/domain/entities/Episode';

const repo = new MongoEpisodeRepository();

export async function getAllEpisodesAction(): Promise<Episode[]> {
  try {
    return getStories(repo);
  } catch (error) {
    console.error('Error al obtener los episodios:', error);
    throw new Error('Error al obtener los episodios: ' + error);
  }
}

export async function getEpisodeByIdAction(
  episodeId: string
): Promise<Episode | null> {
  try {
    return getEpisodeById(repo, episodeId);
  } catch (error) {
    console.error('Error fetching episode:', error);
    throw new Error('Error fetching episode: ' + error);
  }
}
