import { getEpisodeModel } from '@/models/Episode';
import dbConnect from './conection';
import { Episode } from '../types';

export async function getEpisodeById(episodeId: string): Promise<Episode> {
  try {
    await dbConnect();
    const Episode = getEpisodeModel();
    const episode = await Episode.findOne({ _id: episodeId });

    if (!episode) {
      throw new Error('Episode not found: ' + episodeId);
    }

    // Map database fields to frontend expected structure
    const episodeData = episode.toObject();

    // Transform messages to match frontend Message type
    if (episodeData.messages) {
      episodeData.messages = episodeData.messages.map((msg: any) => ({
        id: msg.messageId || msg.id,
        sender: msg.relatorName || msg.sender,
        senderType: msg.relatorName
          ? episode.characters.some(
              (c: any) => c.name === msg.relatorName && c.role === 'host'
            )
            ? 'host'
            : episode.characters.some(
                (c: any) =>
                  c.name === msg.relatorName && c.role === 'protagonist'
              )
            ? 'protagonist'
            : 'host'
          : msg.senderType || 'host',
        language: msg.language,
        requiresTranslation: msg.language === 'es',
        content: msg.content,
        contentHtml: msg.contentHtml,
        contentMarkdown: msg.contentMkd || msg.contentMarkdown,
        officialTranslation: msg.translation || msg.officialTranslation,
        keyPoints: msg.keyPoints || [],
      }));
    }

    return episodeData;
  } catch (error) {
    console.error('Error fetching episode:', error);
    throw new Error('Error fetching episode: ' + error);
  }
}
