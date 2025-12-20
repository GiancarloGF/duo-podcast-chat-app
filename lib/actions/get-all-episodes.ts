import dbConnect from '@/lib/db/conection';
import { getEpisodeModel } from '@/lib/db/models/Episode';
import { Episode } from '@/lib/types';

export async function getAllEpisodes(): Promise<Episode[]> {
  try {
    await dbConnect();
    const Episode = getEpisodeModel();
    const episodes = await Episode.aggregate([
      {
        $project: {
          _id: 1,
          slug: 1,
          number: 1,
          title: 1,
          imageUrl: 1,
          summaryText: 1,
          languageLevel: 1,
          themes: 1,
          messageCount: { $size: { $ifNull: ['$messages', []] } },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const sanitizedEpisodes = episodes.map(
      (episode) =>
        ({
          id: episode._id.toString(),
          slug: episode.slug,
          number: episode.number,
          title: episode.title,
          imageUrl: episode.imageUrl,
          summaryText: episode.summaryText,
          summaryHtml: '',
          languageLevel: episode.languageLevel,
          themes: episode.themes,
          characters: [],
          messages: [], // No traemos messages desde la DB
          messageCount: episode.messageCount ?? 0,
        } as Episode)
    );

    return sanitizedEpisodes;

    // return {
    //     isSuccess: true,
    //     data: episodesWithCount,
    //     message: "Los episodios se han obtenido correctamente",
    // };
  } catch (error) {
    console.error('Error al obtener los episodios:', error);
    throw new Error('Error al obtener los episodios: ' + error);
    // return {
    //     isSuccess: false,
    //     data: [],
    //     message: "Error al obtener los episodios",
    // };
  }
}
