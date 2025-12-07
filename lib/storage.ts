import type { UserStats, EpisodeProgress } from './types';

const STORAGE_KEYS = {
  PROGRESS: 'podcast_progress_',
  STATS: 'podcast_stats',
} as const;

export const storage = {
  // Episode Progress
  getEpisodeProgress(episodeId: string): EpisodeProgress | null {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.PROGRESS}${episodeId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading episode progress:', error);
      return null;
    }
  },

  saveEpisodeProgress(progress: EpisodeProgress): void {
    try {
      localStorage.setItem(
        `${STORAGE_KEYS.PROGRESS}${progress.episodeId}`,
        JSON.stringify(progress)
      );
    } catch (error) {
      console.error('Error saving episode progress:', error);
    }
  },

  deleteEpisodeProgress(episodeId: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEYS.PROGRESS}${episodeId}`);
    } catch (error) {
      console.error('Error deleting episode progress:', error);
    }
  },

  // User Statistics
  getUserStats(): UserStats {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data
        ? JSON.parse(data)
        : {
            totalTranslations: 0,
            totalSkipped: 0,
            completedEpisodes: 0,
            averageScore: 0,
          };
    } catch (error) {
      console.error('Error reading user stats:', error);
      return {
        totalTranslations: 0,
        totalSkipped: 0,
        completedEpisodes: 0,
        averageScore: 0,
      };
    }
  },

  updateUserStats(stats: UserStats): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  },

  // Utility functions
  getAllEpisodeProgresses(): EpisodeProgress[] {
    try {
      const progresses: EpisodeProgress[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEYS.PROGRESS)) {
          const data = localStorage.getItem(key);
          if (data) progresses.push(JSON.parse(data));
        }
      }
      return progresses;
    } catch (error) {
      console.error('Error getting all episode progresses:', error);
      return [];
    }
  },

  clearAllData(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (
          key.startsWith(STORAGE_KEYS.PROGRESS) ||
          key === STORAGE_KEYS.STATS
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all data:', error);
    }
  },
};
