import type { Interaction } from '@/features/stories/domain/entities/Interaction';

export interface StoryChatSummary {
  averageScore: number;
  completed: number;
  scoredCount: number;
  skipped: number;
  totalScore: number;
}

// Aggregate the interactions produced during a story run into a small summary
// object that the completion screen can render directly.
export function getStoryChatSummary(
  interactions: Interaction[] | undefined,
): StoryChatSummary {
  const initialSummary: StoryChatSummary = {
    averageScore: 0,
    completed: 0,
    scoredCount: 0,
    skipped: 0,
    totalScore: 0,
  };

  if (!interactions || interactions.length === 0) {
    return initialSummary;
  }

  const summary = interactions.reduce<StoryChatSummary>((accumulator, interaction) => {
    if (interaction.userInput) {
      accumulator.completed += 1;

      if (interaction.translationFeedback?.score) {
        accumulator.totalScore += interaction.translationFeedback.score;
        accumulator.scoredCount += 1;
      }
    } else {
      accumulator.skipped += 1;
    }

    return accumulator;
  }, initialSummary);

  return {
    ...summary,
    averageScore:
      summary.scoredCount > 0
        ? Math.round(summary.totalScore / summary.scoredCount)
        : 0,
  };
}
