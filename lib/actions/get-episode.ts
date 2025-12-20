import dbConnect from '@/lib/db/conection';
import { getEpisodeModel } from '@/lib/db/models/Episode';
import { Episode } from '@/lib/types';

export async function getEpisodeById(episodeId: string): Promise<Episode> {
  console.log('episodeId', episodeId);
  try {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    const mongoose = (await import('mongoose')).default;

    const episode = await EpisodeModel.findOne({
      _id: new mongoose.Types.ObjectId(episodeId),
    }).lean();

    if (!episode) {
      throw new Error('Episode not found: ' + episodeId);
    }

    const { _id, ...rest } = episode;

    const episodeData: Episode = {
      ...rest,
      id: _id.toString(),
    };

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

    if (episodeData.characters) {
      episodeData.characters = episodeData.characters.map((c: any) => ({
        ...c,
        _id: c._id ? c._id.toString() : undefined,
      }));
    }

    return episodeData as Episode;
  } catch (error) {
    console.error('Error fetching episode:', error);
    throw new Error('Error fetching episode: ' + error);
  }
}
