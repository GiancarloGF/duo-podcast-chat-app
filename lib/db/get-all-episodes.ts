import { getChatModel } from '@/models/Chat';
import dbConnect from './conection';
import { getEpisodeModel } from '@/models/Episode';
import { Episode } from '../types';

export async function getAllEpisodes(): Promise<Episode[]> {
  try {
    await dbConnect();
    const Episode = getEpisodeModel();
    const episodes = await Episode.find({})
      .select('id number title imageUrl summaryText themes characters messages')
      .sort({ createdAt: -1 })
      .lean();

    const sanitizedEpisodes = episodes.map(
      (episode) =>
        ({
          id: episode._id.toString(),
          number: episode.number,
          title: episode.title,
          imageUrl: episode.imageUrl,
          summaryText: episode.summaryText,
          themes: episode.themes,
          characters: episode.characters,
          messages: episode.messages,
        } as Episode)
    );

    const episodesWithCount = sanitizedEpisodes.map((ep: any) => ({
      ...ep,
      messageCount: ep.messages?.length || 0,
      messages: [], // Don't send full messages array for list view
    } as Episode));

    return episodesWithCount;

    // return {
    //     isSuccess: true,
    //     data: episodesWithCount,
    //     message: "Los episodios se han obtenido correctamente",
    // };
  } catch (error) {
    console.error('Error al obtener los episodios:', error);
    throw new Error('Error al obtener los episodios');
    // return {
    //     isSuccess: false,
    //     data: [],
    //     message: "Error al obtener los episodios",
    // };
  }
}
