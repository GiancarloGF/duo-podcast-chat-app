import type { Episode } from './types';

export async function loadEpisode(episodeId: string): Promise<Episode | null> {
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

export async function loadAllEpisodes(): Promise<Episode[]> {
  // In a real app, this would fetch from an API or list all episodes
  // For now, we'll return the available episodes
  const episodeIds = ['ep-1']; // Fixed id to match filename
  const episodes: Episode[] = [];

  for (const id of episodeIds) {
    const episode = await loadEpisode(id);
    if (episode) episodes.push(episode);
  }

  return episodes;
}

function mapJsonToEpisode(id: string, json: any): Episode {
  const characterRoleMap = new Map<string, string>();
  if (json.characters) {
    json.characters.forEach((c: any) => {
      characterRoleMap.set(c.name, c.role);
    });
  }

  return {
    id: json.id || id, // Use id from JSON if available, otherwise use provided id
    number: json.number,
    title: json.title,
    url: json.url,
    imageUrl: json.imageUrl,
    summaryText: json.summaryText,
    summaryHtml: json.summaryHtml,
    languageLevel: json.languageLevel,
    themes: json.themes,
    characters: json.characters,
    messages: json.messages.map((msg: any) => ({
      id: msg.id,
      sender: msg.relatorName,
      senderType: characterRoleMap.get(msg.relatorName) || 'unknown', // Map role
      language: msg.language,
      requiresTranslation: msg.language === 'es',
      content: msg.content,
      contentHtml: msg.contentHtml,
      contentMarkdown: msg.contentMkd,
      officialTranslation: msg.translation,
      keyPoints: msg.keyPoints,
    })),
  };
}

export function getEpisodeBasicInfo(episode: Episode) {
  return {
    id: episode.id,
    title: episode.title,
    description: episode.summaryText, // Mapped to summaryText
    protagonists: episode.characters
      .filter((c) => c.role === 'protagonist')
      .map((p) => p.name)
      .join(', '),
    duration: '20 min', // Mock data as it's not in JSON
    difficulty: episode.languageLevel,
    tags: episode.themes,
  };
}
