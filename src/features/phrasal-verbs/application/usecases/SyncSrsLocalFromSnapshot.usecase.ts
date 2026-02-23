import type {
  LocalPhrasalVerbProgressRow,
  LocalSrsMetaRow,
  PhrasalVerbProgressCompactEntry,
  PhrasalVerbProgressDoc,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import { phrasalVerbSrsDb } from '@/features/phrasal-verbs/infrastructure/storage/phrasalVerbSrsDb';

export function mapCompactEntryToLocalRow(
  pvId: string,
  entry: PhrasalVerbProgressCompactEntry,
  updatedAt: number,
): LocalPhrasalVerbProgressRow {
  return {
    pvId,
    status: entry.s,
    easeFactor: entry.e,
    interval: entry.i,
    repetitions: entry.rp,
    nextReview: entry.nr,
    lastReview: entry.lr,
    timesCorrect: entry.tc,
    timesIncorrect: entry.ti,
    timesViewed: entry.tv,
    updatedAt,
  };
}

export function mapLocalRowToCompactEntry(
  row: LocalPhrasalVerbProgressRow,
): PhrasalVerbProgressCompactEntry {
  return {
    s: row.status,
    e: row.easeFactor,
    i: row.interval,
    rp: row.repetitions,
    nr: row.nextReview,
    lr: row.lastReview,
    tc: row.timesCorrect,
    ti: row.timesIncorrect,
    tv: row.timesViewed,
  };
}

export async function syncSrsLocalFromSnapshot(
  snapshot: PhrasalVerbProgressDoc,
): Promise<void> {
  const updatedAt = Date.now();
  const progressRows = Object.entries(snapshot.progress).map(([pvId, entry]) =>
    mapCompactEntryToLocalRow(pvId, entry, updatedAt),
  );

  const metaRow: LocalSrsMetaRow = {
    key: 'srs_meta',
    totalViewed: snapshot.meta.totalViewed,
    totalMastered: snapshot.meta.totalMastered,
    currentStreak: snapshot.meta.currentStreak,
    longestStreak: snapshot.meta.longestStreak,
    lastSessionAt: snapshot.meta.lastSessionAt,
    analytics: snapshot.meta.analytics,
    lastSyncAt: snapshot.meta.lastSyncAt,
    version: snapshot.meta.version,
  };

  await phrasalVerbSrsDb.transaction(
    'rw',
    phrasalVerbSrsDb.progress,
    phrasalVerbSrsDb.srsMeta,
    async () => {
      await phrasalVerbSrsDb.progress.clear();

      if (progressRows.length > 0) {
        await phrasalVerbSrsDb.progress.bulkPut(progressRows);
      }

      await phrasalVerbSrsDb.srsMeta.put(metaRow);
    },
  );
}
