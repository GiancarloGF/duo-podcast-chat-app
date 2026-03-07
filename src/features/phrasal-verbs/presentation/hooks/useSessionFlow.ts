'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { PracticeQueueBlock } from '@/features/phrasal-verbs/application/usecases/BuildPracticeQueue.usecase';
import { composeSession } from '@/features/phrasal-verbs/application/usecases/ComposeSession.usecase';
import {
  flushPendingSessions,
  type FlushPendingSessionsResult,
} from '@/features/phrasal-verbs/application/usecases/FlushPendingSessions.usecase';
import { syncSrsLocalFromSnapshot } from '@/features/phrasal-verbs/application/usecases/SyncSrsLocalFromSnapshot.usecase';
import type {
  ExerciseResult,
  LocalSrsMetaRow,
  PendingSrsSessionRow,
  PhrasalVerbProgressDoc,
  SessionProgressPatch,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import {
  completeSrsSessionAction,
  flushPendingSrsSessionsAction,
  generatePracticeExerciseAction,
  initializeSrsProgressAction,
  type CompleteSessionResult,
} from '@/features/phrasal-verbs/presentation/actions';
import { usePhrasalVerbCatalog } from '@/features/phrasal-verbs/presentation/hooks/usePhrasalVerbCatalog';
import {
  bootstrapPlannedPracticeSession,
  generatePracticeBlockForIndex,
  normalizeWord,
} from '@/features/phrasal-verbs/presentation/practiceSessionGeneration';
import type { PracticeExerciseBlock } from '@/features/phrasal-verbs/presentation/session.types';
import { useSessionStore } from '@/features/phrasal-verbs/presentation/stores/sessionStore';
import { phrasalVerbSrsDb } from '@/features/phrasal-verbs/infrastructure/storage/phrasalVerbSrsDb';

const LEGACY_PRACTICE_STORAGE_KEY = 'phrasal_verbs_active_practice_session_v1';
const GENERATION_ATTEMPTS_PER_BLOCK = 2;

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function toLocalMeta(meta: PhrasalVerbProgressDoc['meta']): LocalSrsMetaRow {
  return {
    key: 'srs_meta',
    totalViewed: meta.totalViewed,
    totalMastered: meta.totalMastered,
    currentStreak: meta.currentStreak,
    longestStreak: meta.longestStreak,
    lastSessionAt: meta.lastSessionAt,
    analytics: meta.analytics,
    lastSyncAt: meta.lastSyncAt,
    version: meta.version,
  };
}

function mapPatchesToMeta(
  value: CompleteSessionResult['updatedMeta'] | undefined,
): LocalSrsMetaRow | null {
  if (!value) {
    return null;
  }

  return toLocalMeta(value);
}

async function applyProgressPatchesToIndexedDb(
  patches: SessionProgressPatch[],
  completedAt: number,
): Promise<void> {
  if (patches.length === 0) {
    return;
  }

  await phrasalVerbSrsDb.progress.bulkPut(
    patches.map((entry) => ({
      pvId: entry.pvId,
      status: entry.value.s,
      easeFactor: entry.value.e,
      interval: entry.value.i,
      repetitions: entry.value.rp,
      nextReview: entry.value.nr,
      lastReview: entry.value.lr,
      timesCorrect: entry.value.tc,
      timesIncorrect: entry.value.ti,
      timesViewed: entry.value.tv,
      updatedAt: completedAt,
    })),
  );
}

function createPendingRow(params: {
  sessionId: string;
  results: ExerciseResult[];
  sessionDurationSeconds: number;
  composition: { failed: number; review: number; new: number; total: number };
  startedAt: number;
  completedAt: number;
  error: string;
}): PendingSrsSessionRow {
  return {
    sessionId: params.sessionId,
    createdAt: Date.now(),
    status: 'pending',
    payload: {
      sessionId: params.sessionId,
      results: params.results,
      sessionDurationSeconds: params.sessionDurationSeconds,
      composition: params.composition,
      startedAt: params.startedAt,
      completedAt: params.completedAt,
    },
    retryCount: 0,
    lastError: params.error,
  };
}

async function requestGeneratedExerciseBlock(params: {
  practicePlan: PracticeQueueBlock[];
  practiceQueue: PracticeExerciseBlock[];
  index: number;
}): Promise<PracticeExerciseBlock> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= GENERATION_ATTEMPTS_PER_BLOCK; attempt += 1) {
    try {
      return await generatePracticeBlockForIndex({
        practicePlan: params.practicePlan,
        practiceQueue: params.practiceQueue,
        index: params.index,
        generateExercise: async ({ exerciseType, phrasalVerbs, recentUsage }) => {
          const response = await generatePracticeExerciseAction(
            exerciseType,
            phrasalVerbs,
            recentUsage,
          );

          if (!response.success || !response.exercise) {
            throw new Error(
              response.details ?? response.error ?? 'No se pudo generar un ejercicio.',
            );
          }

          return response.exercise;
        },
      });
    } catch (error) {
      lastError = error;
      console.warn('[useSessionFlow] Failed generating exercise block', {
        index: params.index,
        attempt,
        error,
      });
    }
  }

  throw new Error(
    getErrorMessage(lastError, 'No se pudo generar el contenido de un bloque de práctica.'),
  );
}

export function useSessionFlow() {
  const {
    phase,
    isLoading,
    isGeneratingExercise,
    isSaving,
    session,
    practicePlan,
    practiceQueue,
    currentQuestionIndex,
    results,
    srsMeta,
    pendingCount,
    error,
    setLoading,
    setGeneratingExercise,
    setSaving,
    setError,
    setPendingCount,
    bootstrapSession,
    appendPracticeBlock,
    completeTheory,
    completePractice,
    persistSession,
    reset,
  } = useSessionStore();

  const initializedRef = useRef(false);

  const catalog = usePhrasalVerbCatalog({
    superGroup: null,
    group: null,
    categories: [],
    searchTerm: '',
    page: 1,
    pageSize: 3000,
    paginate: false,
  });

  const isCatalogHydrating =
    catalog.hydration.phase === 'checking' ||
    catalog.hydration.phase === 'downloading' ||
    catalog.hydration.phase === 'persisting';

  const canBootstrap =
    catalog.hydration.phase === 'ready' &&
    catalog.items.length > 0 &&
    !isCatalogHydrating;

  const currentExercise = useMemo(
    () => practiceQueue[currentQuestionIndex] ?? null,
    [practiceQueue, currentQuestionIndex],
  );

  const summary = useMemo(() => {
    const correct = results.filter((result) => result.isCorrect).length;
    const total = results.length;

    return {
      correct,
      total,
      accuracy: total === 0 ? 0 : Math.round((correct / total) * 100),
      incorrect: total - correct,
    };
  }, [results]);

  const removeLegacySessionStorage = useCallback(() => {
    try {
      localStorage.removeItem(LEGACY_PRACTICE_STORAGE_KEY);
    } catch (storageError) {
      console.warn('[useSessionFlow] No se pudo limpiar session storage legado.', storageError);
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    const count = await phrasalVerbSrsDb.pendingSessions.count();
    setPendingCount(count);
  }, [setPendingCount]);

  const flushPendingLocalSessions = useCallback(async (): Promise<FlushPendingSessionsResult> => {
    return flushPendingSessions({
      flushRemote: flushPendingSrsSessionsAction,
    });
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      removeLegacySessionStorage();

      const initResult = await initializeSrsProgressAction();

      if (initResult.success && initResult.snapshot) {
        await syncSrsLocalFromSnapshot(initResult.snapshot);
      } else {
        console.warn('[useSessionFlow] Falling back to local SRS cache', {
          error: initResult.error,
          details: initResult.details,
        });
      }

      const flushResult = await flushPendingLocalSessions();
      if (flushResult.error) {
        console.warn('[useSessionFlow] Flush pending result', flushResult);
      }

      if (flushResult.flushed > 0) {
        const refreshed = await initializeSrsProgressAction();
        if (refreshed.success && refreshed.snapshot) {
          await syncSrsLocalFromSnapshot(refreshed.snapshot);
        }
      }

      const [progressRows, localMeta, pendingRows] = await Promise.all([
        phrasalVerbSrsDb.progress.toArray(),
        phrasalVerbSrsDb.srsMeta.get('srs_meta'),
        phrasalVerbSrsDb.pendingSessions.count(),
      ]);

      setPendingCount(pendingRows);

      const composed = composeSession({
        allPhrasalVerbs: catalog.items,
        progressRows,
        totalSessions: localMeta?.analytics.totalSessions,
      });

      if (composed.pvs.length === 0) {
        throw new Error('No hay phrasal verbs disponibles para iniciar una sesión.');
      }

      const plannedPractice = await bootstrapPlannedPracticeSession({
        sessionPvs: composed.pvs,
        generateExercise: async () => {
          throw new Error('No debe generarse contenido durante el bootstrap.');
        },
      });

      if (plannedPractice.practicePlan.length !== 3) {
        throw new Error('No se pudo construir el plan de 3 ejercicios de práctica.');
      }

      const startedAt = Date.now();
      const sessionId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${startedAt}`;

      bootstrapSession({
        session: {
          sessionId,
          startedAt,
          completedAt: null,
          composition: {
            failed: composed.composition.failed,
            review: composed.composition.review,
            new: composed.composition.new,
            total: composed.totalPVs,
          },
          sessionPVs: composed.pvs,
        },
        practicePlan: plannedPractice.practicePlan,
        practiceQueue: plannedPractice.practiceQueue,
        srsMeta: localMeta ?? null,
        srsProgressMap: new Map(progressRows.map((row) => [row.pvId, row])),
      });
    } catch (bootstrapError) {
      const message = getErrorMessage(
        bootstrapError,
        'No se pudo preparar tu sesión SRS. Intenta nuevamente.',
      );

      setError(message);
    } finally {
      setLoading(false);
      await refreshPendingCount();
    }
  }, [
    bootstrapSession,
    catalog.items,
    flushPendingLocalSessions,
    refreshPendingCount,
    removeLegacySessionStorage,
    setError,
    setLoading,
    setPendingCount,
  ]);

  useEffect(() => {
    if (!canBootstrap || initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    void bootstrap();
  }, [bootstrap, canBootstrap]);

  useEffect(() => {
    if (catalog.hydration.phase !== 'error') {
      return;
    }

    if (catalog.items.length > 0) {
      return;
    }

    setError(catalog.hydration.error ?? catalog.hydration.message);
    setLoading(false);
  }, [
    catalog.hydration.error,
    catalog.hydration.message,
    catalog.hydration.phase,
    catalog.items.length,
    setError,
    setLoading,
  ]);

  const ensurePracticeExercise = useCallback(
    async (index: number) => {
      if (index < 0 || index >= practicePlan.length) {
        throw new Error('There is no next exercise planned.');
      }

      if (practiceQueue[index]) {
        return;
      }

      setGeneratingExercise(true);

      try {
        const generatedBlock = await requestGeneratedExerciseBlock({
          practicePlan,
          practiceQueue,
          index,
        });

        appendPracticeBlock(generatedBlock);
      } finally {
        setGeneratingExercise(false);
      }
    },
    [appendPracticeBlock, practicePlan, practiceQueue, setGeneratingExercise],
  );

  const startPracticeSession = useCallback(async () => {
    if (practicePlan.length === 0) {
      throw new Error('No existe un plan de práctica disponible.');
    }

    await ensurePracticeExercise(0);
    completeTheory();
  }, [completeTheory, ensurePracticeExercise, practicePlan.length]);

  const startNewSession = useCallback(async () => {
    reset();
    initializedRef.current = false;

    if (canBootstrap) {
      initializedRef.current = true;
      await bootstrap();
    }
  }, [bootstrap, canBootstrap, reset]);

  const buildExerciseResults = useCallback(
    (
      exercise: PracticeExerciseBlock,
      answersByPvId: Record<string, string | number | undefined>,
    ): ExerciseResult[] => {
      const now = Date.now();

      if (exercise.exerciseType === 'read_and_mark_meaning') {
        return exercise.items.map((item, index) => {
          const selectedIndex =
            typeof answersByPvId[item.pvId] === 'number'
              ? (answersByPvId[item.pvId] as number)
              : -1;

          return {
            pvId: item.pvId,
            phrasalVerb: item.phrasalVerb,
            exerciseType: exercise.exerciseType,
            isCorrect: selectedIndex === item.correctMeaningIndex,
            answeredAt: now + index,
            userAnswer: selectedIndex,
            correctAnswer: item.meanings[item.correctMeaningIndex] ?? '',
          };
        });
      }

      if (exercise.exerciseType === 'mark_sentences_correct') {
        return exercise.items.map((item, index) => {
          const selectedIndex =
            typeof answersByPvId[item.pvId] === 'number'
              ? (answersByPvId[item.pvId] as number)
              : -1;

          const correctAnswer =
            item.correctSentenceIndex === 0
              ? item.firstSentenceMarkdown
              : item.secondSentenceMarkdown;

          return {
            pvId: item.pvId,
            phrasalVerb: item.phrasalVerb,
            exerciseType: exercise.exerciseType,
            isCorrect: selectedIndex === item.correctSentenceIndex,
            answeredAt: now + index,
            userAnswer: selectedIndex,
            correctAnswer,
          };
        });
      }

      return exercise.items.map((item, index) => {
        const selectedWord =
          typeof answersByPvId[item.pvId] === 'string'
            ? String(answersByPvId[item.pvId]).trim()
            : '';

        return {
          pvId: item.pvId,
          phrasalVerb: item.phrasalVerb,
          exerciseType: exercise.exerciseType,
          isCorrect: normalizeWord(selectedWord) === normalizeWord(item.correctWord),
          answeredAt: now + index,
          userAnswer: selectedWord,
          correctAnswer: item.correctWord,
        };
      });
    },
    [],
  );

  const finishPractice = useCallback(
    async (exerciseResults: ExerciseResult[]) => {
      if (!session) {
        return;
      }

      setSaving(true);

      const completedAt = Date.now();
      const sessionDurationSeconds = Math.max(
        0,
        Math.round((completedAt - session.startedAt) / 1000),
      );

      try {
        const result = await completeSrsSessionAction({
          sessionId: session.sessionId,
          results: exerciseResults,
          sessionDurationSeconds,
          composition: session.composition,
          startedAt: session.startedAt,
          completedAt,
        });

        if (result.success) {
          const nextMeta = mapPatchesToMeta(result.updatedMeta);

          if (nextMeta) {
            await phrasalVerbSrsDb.srsMeta.put(nextMeta);
          }

          const patches = result.updatedProgressByPvId ?? [];
          await applyProgressPatchesToIndexedDb(patches, completedAt);

          persistSession({
            updatedMeta: nextMeta,
            updatedProgressByPvId: patches,
            completedAt,
          });
          completePractice(exerciseResults);
          return;
        }

        const sessionId = result.sessionId ?? session.sessionId;
        const pending = createPendingRow({
          sessionId,
          results: exerciseResults,
          sessionDurationSeconds,
          composition: session.composition,
          startedAt: session.startedAt,
          completedAt,
          error: result.error ?? 'No se pudo guardar la sesión.',
        });

        await phrasalVerbSrsDb.pendingSessions.put(pending);
        completePractice(exerciseResults);
      } catch (persistError) {
        const pending = createPendingRow({
          sessionId: session.sessionId,
          results: exerciseResults,
          sessionDurationSeconds,
          composition: session.composition,
          startedAt: session.startedAt,
          completedAt,
          error: getErrorMessage(persistError, 'No se pudo guardar la sesión.'),
        });

        await phrasalVerbSrsDb.pendingSessions.put(pending);
        completePractice(exerciseResults);
      } finally {
        setSaving(false);
        await refreshPendingCount();
      }
    },
    [completePractice, persistSession, refreshPendingCount, session, setSaving],
  );

  return {
    phase,
    isLoading,
    isGeneratingExercise,
    isSaving,
    error,
    catalogHydration: catalog.hydration,
    session,
    practicePlan,
    practiceQueue,
    currentExercise,
    currentQuestionIndex,
    results,
    summary,
    srsMeta,
    pendingCount,
    totalExercises: practicePlan.length,
    completeTheory,
    startPracticeSession,
    ensurePracticeExercise,
    buildExerciseResults,
    finishPractice,
    startNewSession,
    retryBootstrap: bootstrap,
  };
}
