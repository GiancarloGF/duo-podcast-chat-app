import { describe, expect, it } from 'vitest';
import { calculateSrsUpdate } from '@/features/phrasal-verbs/application/services/SrsAlgorithm.service';

describe('calculateSrsUpdate', () => {
  it('creates first-view learning state on first correct answer', () => {
    const result = calculateSrsUpdate({
      pvId: 'pv-1',
      currentProgress: null,
      isCorrect: true,
      nowMs: 1_700_000_000_000,
    });

    expect(result.status).toBe('learning');
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.timesViewed).toBe(1);
    expect(result.timesCorrect).toBe(1);
    expect(result.timesIncorrect).toBe(0);
    expect(result.isFirstView).toBe(true);
  });

  it('resets repetitions to 0 on incorrect answer', () => {
    const result = calculateSrsUpdate({
      pvId: 'pv-2',
      currentProgress: {
        pvId: 'pv-2',
        status: 'review',
        easeFactor: 2.4,
        interval: 7,
        repetitions: 3,
        nextReview: null,
        lastReview: null,
        timesCorrect: 3,
        timesIncorrect: 0,
        timesViewed: 3,
        updatedAt: 1,
      },
      isCorrect: false,
      nowMs: 1_700_000_000_000,
    });

    expect(result.status).toBe('learning');
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.timesCorrect).toBe(3);
    expect(result.timesIncorrect).toBe(1);
    expect(result.timesViewed).toBe(4);
  });

  it('marks item as mastered after long interval', () => {
    const result = calculateSrsUpdate({
      pvId: 'pv-3',
      currentProgress: {
        pvId: 'pv-3',
        status: 'review',
        easeFactor: 2.6,
        interval: 15,
        repetitions: 4,
        nextReview: null,
        lastReview: null,
        timesCorrect: 4,
        timesIncorrect: 1,
        timesViewed: 5,
        updatedAt: 1,
      },
      isCorrect: true,
      nowMs: 1_700_000_000_000,
    });

    expect(result.status).toBe('mastered');
    expect(result.interval).toBeGreaterThanOrEqual(30);
    expect(result.justMastered).toBe(true);
  });

  it('never sets ease factor below 1.3', () => {
    const result = calculateSrsUpdate({
      pvId: 'pv-4',
      currentProgress: {
        pvId: 'pv-4',
        status: 'learning',
        easeFactor: 1.3,
        interval: 1,
        repetitions: 1,
        nextReview: null,
        lastReview: null,
        timesCorrect: 1,
        timesIncorrect: 5,
        timesViewed: 6,
        updatedAt: 1,
      },
      isCorrect: false,
      nowMs: 1_700_000_000_000,
    });

    expect(result.easeFactor).toBe(1.3);
  });
});
