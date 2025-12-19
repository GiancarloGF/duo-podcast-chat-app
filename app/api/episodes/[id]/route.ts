import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/conection';
import { getEpisodeModel } from '@/models/Episode';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const Episode = getEpisodeModel();
    const episode = await Episode.findOne({ id: id });

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
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

    return NextResponse.json(episodeData);
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episode' },
      { status: 500 }
    );
  }
}
