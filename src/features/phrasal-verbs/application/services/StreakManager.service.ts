export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastSessionAt: number | null;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfDayMs(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function calculateNewStreak(
  currentStreak: StreakData,
  sessionCompletedAt: number,
): StreakData {
  if (!currentStreak.lastSessionAt) {
    return {
      currentStreak: 1,
      longestStreak: 1,
      lastSessionAt: sessionCompletedAt,
    };
  }

  const sessionDayMs = startOfDayMs(sessionCompletedAt);
  const lastSessionDayMs = startOfDayMs(currentStreak.lastSessionAt);
  const daysDiff = Math.floor((sessionDayMs - lastSessionDayMs) / DAY_IN_MS);

  if (daysDiff === 0) {
    return {
      ...currentStreak,
      lastSessionAt: sessionCompletedAt,
    };
  }

  if (daysDiff === 1) {
    const nextStreak = currentStreak.currentStreak + 1;

    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(currentStreak.longestStreak, nextStreak),
      lastSessionAt: sessionCompletedAt,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: currentStreak.longestStreak,
    lastSessionAt: sessionCompletedAt,
  };
}
