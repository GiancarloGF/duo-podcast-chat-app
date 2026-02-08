import { NextResponse } from 'next/server';
import dbConnect from '@/shared/infrastructure/database/mongo/connection';
import { getEpisodeModel } from '@/shared/infrastructure/database/mongo/models/Episode';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const Episode = getEpisodeModel();
    const episode = await Episode.findOne({ id }).lean();

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    const episodeData = episode as Record<string, unknown>;
    const ep = episode as { characters?: { name: string; role: string }[] };

    if (episodeData.messages && Array.isArray(episodeData.messages)) {
      const characters = ep.characters || [];
      episodeData.messages = (episodeData.messages as Record<string, unknown>[]).map(
        (msg: Record<string, unknown>) => ({
          id: msg.messageId || msg.id,
          sender: msg.relatorName || msg.sender,
          senderType: (msg.relatorName as string)
            ? characters.some(
                (c) => c.name === (msg.relatorName as string) && c.role === 'host'
              )
              ? 'host'
              : characters.some(
                  (c) =>
                    c.name === (msg.relatorName as string) && c.role === 'protagonist'
                )
                ? 'protagonist'
                : 'host'
            : msg.senderType || 'host',
          language: msg.language,
          requiresTranslation: (msg.language as string) === 'es',
          content: msg.content,
          contentHtml: msg.contentHtml,
          contentMarkdown: msg.contentMkd || msg.contentMarkdown,
          officialTranslation: msg.translation || msg.officialTranslation,
          keyPoints: msg.keyPoints || [],
        })
      );
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
