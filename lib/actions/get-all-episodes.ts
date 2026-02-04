import { MongoStoryRepository } from '@/src/infrastructure/database/mongo/MongoStoryRepository';
import { Episode } from '@/lib/types';

export async function getAllEpisodes(): Promise<Episode[]> {
  try {
    const repo = new MongoStoryRepository();
    const stories = await repo.getStories();

    return stories.map(
      (story) =>
        ({
          id: story.id,
          slug: story.slug,
          number: story.number,
          title: story.title,
          imageUrl: story.imageUrl,
          summaryText: story.summaryText,
          summaryHtml: story.summaryHtml,
          languageLevel: story.languageLevel,
          themes: story.themes,
          characters: story.characters,
          messages: [], // Optimización: no enviamos mensajes a la lista
          messageCount: story.messageCount ?? 0,
        }) as Episode,
    );
  } catch (error) {
    console.error('Error al obtener los episodios:', error);
    throw new Error('Error al obtener los episodios: ' + error);
  }
}
