import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { Message } from '@/features/stories/domain/entities/Message';

export function mapDocToEpisodeList(doc: Record<string, unknown>): Episode {
  return {
    id: (doc.id as string) || (doc._id as { toString: () => string }).toString(),
    slug: doc.slug as string,
    number: doc.number as number,
    title: doc.title as string,
    url: doc.url as string | undefined,
    imageUrl: doc.imageUrl as string,
    summaryText: doc.summaryText as string,
    summaryHtml: doc.summaryHtml as string,
    languageLevel: doc.languageLevel as string,
    themes: (doc.themes as string[]) || [],
    characters: (doc.characters as Episode['characters']) || [],
    messages: [],
    messageCount:
      doc.messageCount !== undefined
        ? (doc.messageCount as number)
        : Array.isArray(doc.messages)
          ? (doc.messages as unknown[]).length
          : 0,
    createdAt: doc.createdAt ? new Date(doc.createdAt as string) : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string) : undefined,
  };
}

export function mapDocToEpisodeFull(
  doc: Record<string, unknown>,
  episode: Record<string, unknown>
): Episode {
  const characters = (episode.characters as { name: string; role: string }[]) || [];
  const messages = ((doc.messages as unknown[]) || []).map((msg) =>
    mapMessage((msg ?? {}) as Record<string, unknown>, characters)
  );
  return {
    id: (doc.id as string) || (doc._id as { toString: () => string }).toString(),
    slug: doc.slug as string,
    number: doc.number as number,
    title: doc.title as string,
    url: doc.url as string | undefined,
    imageUrl: doc.imageUrl as string,
    summaryText: doc.summaryText as string,
    summaryHtml: doc.summaryHtml as string,
    languageLevel: doc.languageLevel as string,
    themes: (doc.themes as string[]) || [],
    characters: (doc.characters as Episode['characters']) || [],
    messages,
    messageCount: messages.length,
    createdAt: doc.createdAt ? new Date(doc.createdAt as string) : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string) : undefined,
  };
}

function mapMessage(
  msg: Record<string, unknown>,
  characters: { name: string; role: string }[]
): Message {
  const relatorName = (msg.relatorName || msg.sender) as string;
  let senderType = (msg.senderType as string) || 'host';
  if (relatorName) {
    if (characters.some((c) => c.name === relatorName && c.role === 'host')) senderType = 'host';
    else if (characters.some((c) => c.name === relatorName && c.role === 'protagonist'))
      senderType = 'protagonist';
  }
  return {
    id: (msg.messageId || msg.id) as string,
    sender: relatorName,
    senderType,
    language: (msg.language as Message['language']) || 'es',
    requiresTranslation: (msg.language as string) === 'es',
    content: (msg.content as string) || '',
    contentHtml: (msg.contentHtml as string) || '',
    contentMarkdown: (msg.contentMkd || msg.contentMarkdown) as string,
    officialTranslation: (msg.translation || msg.officialTranslation) as string | null,
    keyPoints: (msg.keyPoints as Message['keyPoints']) || [],
  };
}
