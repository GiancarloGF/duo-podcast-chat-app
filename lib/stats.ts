import type { UserStats, EpisodeProgress } from './types';

export class StatsService {
  // Calculate user statistics from all episode progress
  static calculateUserStats(allProgress: EpisodeProgress[]): UserStats {
    let totalTranslations = 0;
    let totalSkipped = 0;
    let completedEpisodes = 0;
    const allScores: number[] = [];

    allProgress.forEach((progress) => {
      progress.translations.forEach((translation) => {
        if (translation.skipped) {
          totalSkipped++;
        } else {
          totalTranslations++;
          if (translation.feedback?.score) {
            allScores.push(translation.feedback.score);
          }
        }
      });

      // Check if episode is completed (all messages processed)
      if (progress.completedAt) {
        completedEpisodes++;
      }
    });

    const averageScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b) / allScores.length)
        : 0;

    return {
      totalTranslations,
      totalSkipped,
      completedEpisodes,
      averageScore,
    };
  }

  // Get progress summary for a specific episode
  static getEpisodeStats(progress: EpisodeProgress) {
    const completed = progress.translations.filter((t) => !t.skipped).length;
    const skipped = progress.translations.filter((t) => t.skipped).length;
    const withFeedback = progress.translations.filter((t) => t.feedback).length;
    const averageScore =
      withFeedback > 0
        ? Math.round(
            progress.translations
              .filter((t) => t.feedback)
              .reduce((sum, t) => sum + (t.feedback?.score || 0), 0) /
              withFeedback
          )
        : 0;

    return {
      completed,
      skipped,
      withFeedback,
      averageScore,
    };
  }

  // Determine user level based on average score
  static getLevel(averageScore: number): string {
    if (averageScore >= 90) return 'Advanced';
    if (averageScore >= 75) return 'Intermediate';
    if (averageScore >= 60) return 'Beginner';
    return 'Starting';
  }

  // Get streak information (days with translations)
  static getStreak(allProgress: EpisodeProgress[]): number {
    const dates = new Set<string>();

    allProgress.forEach((progress) => {
      progress.translations.forEach((translation) => {
        const date = new Date(translation.timestamp)
          .toISOString()
          .split('T')[0];
        dates.add(date);
      });
    });

    return dates.size;
  }
}
