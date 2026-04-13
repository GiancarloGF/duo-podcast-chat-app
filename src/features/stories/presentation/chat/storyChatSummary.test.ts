import { describe, expect, it } from 'vitest';
import { getStoryChatSummary } from '@/features/stories/presentation/chat/storyChatSummary';

describe('getStoryChatSummary', () => {
  it('returns zeroed summary for empty interactions', () => {
    expect(getStoryChatSummary(undefined)).toEqual({
      averageScore: 0,
      completed: 0,
      scoredCount: 0,
      skipped: 0,
      totalScore: 0,
    });
  });

  it('aggregates completed translations and average score', () => {
    const summary = getStoryChatSummary([
      {
        messageId: 'm-1',
        userInput: 'hola',
        translationFeedback: {
          score: 80,
          userTranslation: 'hola',
          officialTranslation: 'hello',
          originalContent: 'hola',
          analysis: 'bien',
          suggestions: [],
          detailedAnalysis: {
            grammar: 'good',
            vocabulary: 'good',
            construction: 'good',
          },
          phrasalVerbs: {
            relevant: false,
            suggestions: [],
          },
        },
        isCorrect: true,
        timestamp: new Date(),
      },
      {
        messageId: 'm-2',
        userInput: 'mundo',
        translationFeedback: {
          score: 100,
          userTranslation: 'mundo',
          officialTranslation: 'world',
          originalContent: 'mundo',
          analysis: 'excelente',
          suggestions: [],
          detailedAnalysis: {
            grammar: 'great',
            vocabulary: 'great',
            construction: 'great',
          },
          phrasalVerbs: {
            relevant: false,
            suggestions: [],
          },
        },
        isCorrect: true,
        timestamp: new Date(),
      },
      {
        messageId: 'm-3',
        userInput: '',
        translationFeedback: undefined,
        isCorrect: false,
        timestamp: new Date(),
      },
    ]);

    expect(summary.completed).toBe(2);
    expect(summary.skipped).toBe(1);
    expect(summary.averageScore).toBe(90);
  });
});
