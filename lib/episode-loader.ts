import type { Episode } from "./types"

export async function loadEpisode(episodeId: string): Promise<Episode | null> {
  try {
    const response = await fetch(`/episodes/${episodeId}.json`)
    if (!response.ok) throw new Error(`Failed to load episode ${episodeId}`)
    const data = await response.json()
    return data.episode
  } catch (error) {
    console.error("Error loading episode:", error)
    return null
  }
}

export async function loadAllEpisodes(): Promise<Episode[]> {
  // In a real app, this would fetch from an API or list all episodes
  // For now, we'll return the available episodes
  const episodeIds = ["ep_001"]
  const episodes: Episode[] = []

  for (const id of episodeIds) {
    const episode = await loadEpisode(id)
    if (episode) episodes.push(episode)
  }

  return episodes
}

export function getEpisodeBasicInfo(episode: Episode) {
  return {
    id: episode.id,
    title: episode.title,
    description: episode.description,
    protagonists: episode.protagonists.map((p) => p.name).join(", "),
    duration: episode.estimatedDuration,
    difficulty: episode.difficulty,
    tags: episode.tags,
  }
}
