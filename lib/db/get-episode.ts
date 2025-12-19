import { getEpisodeModel } from '@/models/Episode';
import dbConnect from './conection';
import { Episode } from '../types';

export async function getEpisodeById(episodeId: string): Promise<Episode> {
  try {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    // Use lean() for performance and plain object return
    const episode = await EpisodeModel.findOne({ _id: episodeId }).lean();

    if (!episode) {
      throw new Error('Episode not found: ' + episodeId);
    }

    // Map database fields to frontend expected structure
    const episodeData: any = {
      ...episode,
      _id: episode._id.toString(), // Explicitly stringify _id
      id: episode._id.toString(), // Ensure ID is string
    };

    // Safety check: delete recursive or weird fields if any (Mongoose lean is usually clean except for _id/Dates)
    // Dates are serializable by Next.js if they are Date objects (it converts to ISO string automatically in server components?
    // actually NO, strictly speaking only plain objects. Next.js recent versions might handle Dates but it's risky).
    // The error message specifically mentioned _id buffer, so let's fix that first.

    // To be 100% safe, we can JSON parse/stringify
    // return JSON.parse(JSON.stringify(episodeData));
    // But that's heavy. Let's trust manual conversion for now but ensure _id is overwritten.

    // Remove _id to avoid confusion if needed, or keep it.
    // Usually frontend uses 'id' from the type definition.

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

    // Explicitly delete _id if we don't want it, or keep it as string
    // episodeData._id is already stringified above.
    // However, characters and other sub-arrays might have _ids too if they are subdocuments.
    // Let's safe-guard against sub-document _ids.

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
