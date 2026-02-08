import type {
  UserStats,
  EpisodeProgress,
} from '@/features/stories/domain/types';

/**
 * Servicio de estadísticas derivadas del progreso de episodios.
 */
export class StatsService {
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
          if (translation.feedback?.score !== undefined) {
            allScores.push(translation.feedback.score);
          }
        }
      });

      if (progress.completedAt !== undefined) {
        completedEpisodes++;
      }
    });

    const averageScore =
      allScores.length > 0
        ? Math.round(
            allScores.reduce((a, b) => a + b, 0) / allScores.length
          )
        : 0;

    return {
      totalTranslations,
      totalSkipped,
      completedEpisodes,
      averageScore,
    };
  }

  static getEpisodeStats(progress: EpisodeProgress): {
    completed: number;
    skipped: number;
    withFeedback: number;
    averageScore: number;
  } {
    const completed = progress.translations.filter((t) => !t.skipped).length;
    const skipped = progress.translations.filter((t) => t.skipped).length;
    const withFeedback = progress.translations.filter((t) => t.feedback).length;
    const averageScore =
      withFeedback > 0
        ? Math.round(
            progress.translations
              .filter((t) => t.feedback)
              .reduce((sum, t) => sum + (t.feedback?.score ?? 0), 0) /
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

  static getLevel(averageScore: number): string {
    if (averageScore >= 90) return 'Advanced';
    if (averageScore >= 75) return 'Intermediate';
    if (averageScore >= 60) return 'Beginner';
    return 'Starting';
  }

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
