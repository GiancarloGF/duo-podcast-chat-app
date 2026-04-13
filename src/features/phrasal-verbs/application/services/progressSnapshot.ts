import type {
  PhrasalVerbProgressCompactEntry,
  PhrasalVerbProgressDoc,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

export const SRS_PROGRESS_DOC_ID = 'phrasalVerbsProgress';
export const SRS_SCHEMA_VERSION = 1;

// Build the canonical empty document used both by server reads and writes.
export function createInitialProgressDoc(nowMs: number): PhrasalVerbProgressDoc {
  return {
    progress: {},
    meta: {
      totalViewed: 0,
      totalMastered: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionAt: null,
      analytics: {
        totalSessions: 0,
        totalExercises: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageAccuracy: 0,
        totalTimeSeconds: 0,
        firstSessionAt: null,
      },
      lastSyncAt: nowMs,
      version: SRS_SCHEMA_VERSION,
    },
  };
}

function isValidProgressCompactEntry(value: unknown): value is PhrasalVerbProgressCompactEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.s === 'string' &&
    typeof candidate.e === 'number' &&
    typeof candidate.i === 'number' &&
    typeof candidate.rp === 'number' &&
    (typeof candidate.nr === 'number' || candidate.nr === null) &&
    (typeof candidate.lr === 'number' || candidate.lr === null) &&
    typeof candidate.tc === 'number' &&
    typeof candidate.ti === 'number' &&
    typeof candidate.tv === 'number'
  );
}

// Firestore documents may be partially missing fields during older writes or
// manual edits. Normalize them into the current schema before the rest of the
// app consumes the snapshot.
export function normalizeProgressDoc(rawData: unknown, nowMs: number): PhrasalVerbProgressDoc {
  if (!rawData || typeof rawData !== 'object') {
    return createInitialProgressDoc(nowMs);
  }

  const data = rawData as Record<string, unknown>;
  const rawProgress = data.progress;
  const rawMeta = data.meta;
  const rawAnalytics =
    rawMeta && typeof rawMeta === 'object'
      ? (rawMeta as Record<string, unknown>).analytics
      : undefined;

  const progress: Record<string, PhrasalVerbProgressCompactEntry> = {};

  if (rawProgress && typeof rawProgress === 'object') {
    Object.entries(rawProgress as Record<string, unknown>).forEach(([pvId, value]) => {
      if (isValidProgressCompactEntry(value)) {
        progress[pvId] = {
          s: value.s,
          e: value.e,
          i: value.i,
          rp: value.rp,
          nr: value.nr,
          lr: value.lr,
          tc: value.tc,
          ti: value.ti,
          tv: value.tv,
        };
      }
    });
  }

  const meta = {
    totalViewed:
      rawMeta && typeof rawMeta === 'object' && typeof (rawMeta as Record<string, unknown>).totalViewed === 'number'
        ? ((rawMeta as Record<string, unknown>).totalViewed as number)
        : 0,
    totalMastered:
      rawMeta && typeof rawMeta === 'object' && typeof (rawMeta as Record<string, unknown>).totalMastered === 'number'
        ? ((rawMeta as Record<string, unknown>).totalMastered as number)
        : 0,
    currentStreak:
      rawMeta && typeof rawMeta === 'object' && typeof (rawMeta as Record<string, unknown>).currentStreak === 'number'
        ? ((rawMeta as Record<string, unknown>).currentStreak as number)
        : 0,
    longestStreak:
      rawMeta && typeof rawMeta === 'object' && typeof (rawMeta as Record<string, unknown>).longestStreak === 'number'
        ? ((rawMeta as Record<string, unknown>).longestStreak as number)
        : 0,
    lastSessionAt:
      rawMeta &&
      typeof rawMeta === 'object' &&
      (typeof (rawMeta as Record<string, unknown>).lastSessionAt === 'number' ||
        (rawMeta as Record<string, unknown>).lastSessionAt === null)
        ? ((rawMeta as Record<string, unknown>).lastSessionAt as number | null)
        : null,
    analytics: {
      totalSessions:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        typeof (rawAnalytics as Record<string, unknown>).totalSessions === 'number'
          ? ((rawAnalytics as Record<string, unknown>).totalSessions as number)
          : 0,
      totalExercises:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        typeof (rawAnalytics as Record<string, unknown>).totalExercises === 'number'
          ? ((rawAnalytics as Record<string, unknown>).totalExercises as number)
          : 0,
      totalCorrect:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        typeof (rawAnalytics as Record<string, unknown>).totalCorrect === 'number'
          ? ((rawAnalytics as Record<string, unknown>).totalCorrect as number)
          : 0,
      totalIncorrect:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        typeof (rawAnalytics as Record<string, unknown>).totalIncorrect === 'number'
          ? ((rawAnalytics as Record<string, unknown>).totalIncorrect as number)
          : 0,
      averageAccuracy:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        typeof (rawAnalytics as Record<string, unknown>).averageAccuracy === 'number'
          ? ((rawAnalytics as Record<string, unknown>).averageAccuracy as number)
          : 0,
      totalTimeSeconds:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        typeof (rawAnalytics as Record<string, unknown>).totalTimeSeconds === 'number'
          ? ((rawAnalytics as Record<string, unknown>).totalTimeSeconds as number)
          : 0,
      firstSessionAt:
        rawAnalytics &&
        typeof rawAnalytics === 'object' &&
        (typeof (rawAnalytics as Record<string, unknown>).firstSessionAt === 'number' ||
          (rawAnalytics as Record<string, unknown>).firstSessionAt === null)
          ? ((rawAnalytics as Record<string, unknown>).firstSessionAt as number | null)
          : null,
    },
    lastSyncAt:
      rawMeta && typeof rawMeta === 'object' && typeof (rawMeta as Record<string, unknown>).lastSyncAt === 'number'
        ? ((rawMeta as Record<string, unknown>).lastSyncAt as number)
        : nowMs,
    version:
      rawMeta && typeof rawMeta === 'object' && typeof (rawMeta as Record<string, unknown>).version === 'number'
        ? ((rawMeta as Record<string, unknown>).version as number)
        : SRS_SCHEMA_VERSION,
  };

  return {
    progress,
    meta,
  };
}
