import type { PendingSrsSessionRow } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import { phrasalVerbSrsDb } from '@/features/phrasal-verbs/infrastructure/storage/phrasalVerbSrsDb';

export interface FlushPendingInputPayload {
  sessions: PendingSrsSessionRow['payload'][];
}

export interface FlushPendingRemoteResult {
  success: boolean;
  processedSessionIds?: string[];
  failedSessionIds?: string[];
  error?: string;
}

export interface FlushPendingSessionsResult {
  attempted: number;
  flushed: number;
  remaining: number;
  error: string | null;
}

export async function flushPendingSessions(options: {
  flushRemote: (input: FlushPendingInputPayload) => Promise<FlushPendingRemoteResult>;
}): Promise<FlushPendingSessionsResult> {
  const pendingRows = await phrasalVerbSrsDb.pendingSessions
    .orderBy('createdAt')
    .toArray();

  if (pendingRows.length === 0) {
    return {
      attempted: 0,
      flushed: 0,
      remaining: 0,
      error: null,
    };
  }

  const remoteResult = await options.flushRemote({
    sessions: pendingRows.map((row) => row.payload),
  });

  if (!remoteResult.success) {
    const nowMs = Date.now();

    await phrasalVerbSrsDb.transaction(
      'rw',
      phrasalVerbSrsDb.pendingSessions,
      async () => {
        await Promise.all(
          pendingRows.map((row) =>
            phrasalVerbSrsDb.pendingSessions.put({
              ...row,
              status: 'failed',
              retryCount: row.retryCount + 1,
              lastError: remoteResult.error ?? 'No se pudo sincronizar.',
              createdAt: row.createdAt || nowMs,
            }),
          ),
        );
      },
    );

    return {
      attempted: pendingRows.length,
      flushed: 0,
      remaining: pendingRows.length,
      error: remoteResult.error ?? 'No se pudo sincronizar el progreso pendiente.',
    };
  }

  const processed = new Set(remoteResult.processedSessionIds ?? []);
  const failed = new Set(remoteResult.failedSessionIds ?? []);

  await phrasalVerbSrsDb.transaction(
    'rw',
    phrasalVerbSrsDb.pendingSessions,
    async () => {
      await Promise.all(
        pendingRows.map(async (row) => {
          if (processed.has(row.sessionId)) {
            await phrasalVerbSrsDb.pendingSessions.delete(row.sessionId);
            return;
          }

          if (failed.has(row.sessionId)) {
            await phrasalVerbSrsDb.pendingSessions.put({
              ...row,
              status: 'failed',
              retryCount: row.retryCount + 1,
              lastError: 'La sesion pendiente fallo al sincronizar.',
            });
          }
        }),
      );
    },
  );

  const remaining = await phrasalVerbSrsDb.pendingSessions.count();

  return {
    attempted: pendingRows.length,
    flushed: processed.size,
    remaining,
    error: null,
  };
}
