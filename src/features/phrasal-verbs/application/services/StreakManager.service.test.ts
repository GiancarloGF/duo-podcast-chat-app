import { describe, expect, it } from 'vitest';
import { calculateNewStreak } from '@/features/phrasal-verbs/application/services/StreakManager.service';

describe('calculateNewStreak', () => {
  it('starts streak at 1 for first session', () => {
    const result = calculateNewStreak(
      {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionAt: null,
      },
      new Date('2026-02-20T10:00:00Z').getTime(),
    );

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it('keeps streak on same day', () => {
    const day = new Date('2026-02-20T10:00:00Z').getTime();
    const result = calculateNewStreak(
      {
        currentStreak: 5,
        longestStreak: 7,
        lastSessionAt: day,
      },
      new Date('2026-02-20T23:59:00Z').getTime(),
    );

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(7);
  });

  it('increments streak on consecutive day', () => {
    const result = calculateNewStreak(
      {
        currentStreak: 5,
        longestStreak: 7,
        lastSessionAt: new Date('2026-02-20T08:00:00Z').getTime(),
      },
      new Date('2026-02-21T08:30:00Z').getTime(),
    );

    expect(result.currentStreak).toBe(6);
    expect(result.longestStreak).toBe(7);
  });

  it('resets streak after a gap', () => {
    const result = calculateNewStreak(
      {
        currentStreak: 5,
        longestStreak: 9,
        lastSessionAt: new Date('2026-02-20T08:00:00Z').getTime(),
      },
      new Date('2026-02-25T08:30:00Z').getTime(),
    );

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(9);
  });
});
