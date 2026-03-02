import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { Message } from '@/features/stories/domain/entities/Message';
import type { Character } from '@/features/stories/domain/entities/Character';

/**
 * Carga un episodio desde JSON estático (ej. /episodes/{id}.json).
 * Para datos desde API/DB usar getEpisodeByIdAction y MongoEpisodeRepository.
 */
export async function loadEpisodeFromJson(
  episodeId: string
): Promise<Episode | null> {
  try {
    const response = await fetch(`/episodes/${episodeId}.json`);
    if (!response.ok) throw new Error(`Failed to load episode ${episodeId}`);
    const rawData = await response.json();
    return mapJsonToEpisode(episodeId, rawData);
  } catch (error) {
    console.error('Error loading episode:', error);
    return null;
  }
}

export async function loadAllEpisodesFromJson(): Promise<Episode[]> {
  const episodeIds = ['ep-1'];
  const episodes: Episode[] = [];
  for (const id of episodeIds) {
    const episode = await loadEpisodeFromJson(id);
    if (episode) episodes.push(episode);
  }
  return episodes;
}

function mapJsonToEpisode(id: string, json: Record<string, unknown>): Episode {
  const characterRoleMap = new Map<string, string>();
  const characters = (json.characters as { name: string; role: string }[]) || [];
  characters.forEach((c) => characterRoleMap.set(c.name, c.role));

  const messages = ((json.messages as Record<string, unknown>[]) || []).map(
    (msg: Record<string, unknown>): Message => ({
      id: (msg.id as string) ?? '',
      sender: (msg.relatorName as string) ?? '',
      senderType: characterRoleMap.get((msg.relatorName as string) ?? '') ?? 'unknown',
      language: (msg.language as Message['language']) ?? 'es',
      content: (msg.content as string) ?? '',
      contentHtml: (msg.contentHtml as string) ?? '',
      contentMarkdown: (msg.contentMkd as string) ?? '',
      officialTranslation: (msg.translation as string) ?? null,
      keyPoints: (msg.keyPoints as Message['keyPoints']) ?? [],
      requiresTranslation: (msg.language as string) === 'es',
    })
  );

  return {
    id: (json.id as string) || id,
    slug: (json.slug as string) || id,
    number: (json.number as number) ?? (json.episodeNumber as number) ?? 0,
    title: (json.title as string) ?? (json.episodeTitle as string) ?? '',
    url: json.url as string | undefined,
    imageUrl: (json.imageUrl as string) ?? '',
    summaryText: (json.summaryText as string) ?? '',
    summaryHtml: (json.summaryHtml as string) ?? '',
    languageLevel: (json.languageLevel as string) ?? '',
    themes: (json.themes as string[]) ?? [],
    characters: characters as Character[],
    messages,
    messageCount: messages.length,
  };
}

export function getEpisodeBasicInfo(episode: Episode): {
  id: string;
  title: string;
  description: string;
  protagonists: string;
  duration: string;
  difficulty: string;
  tags: string[];
} {
  return {
    id: episode.id,
    title: episode.title,
    description: episode.summaryText,
    protagonists: episode.characters
      .filter((c) => c.role === 'protagonist')
      .map((p) => p.name)
      .join(', '),
    duration: '20 min',
    difficulty: episode.languageLevel,
    tags: episode.themes,
  };
}
