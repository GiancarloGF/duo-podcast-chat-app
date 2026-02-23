'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserId } from '@/features/auth/presentation/actions';
import { calculateSrsUpdate } from '@/features/phrasal-verbs/application/services/SrsAlgorithm.service';
import { calculateNewStreak } from '@/features/phrasal-verbs/application/services/StreakManager.service';
import { GeminiPracticeExerciseService } from '@/features/phrasal-verbs/infrastructure/services/GeminiPracticeExerciseService';
import {
  practiceExerciseTypeSchema,
  practiceExerciseRequestSchema,
  type PracticeExercise,
  type PracticeExercisePhrasalVerbInput,
  type PracticeExerciseType,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';
import type {
  ExerciseResult,
  LocalPhrasalVerbProgressRow,
  PhrasalVerbProgressCompactEntry,
  PhrasalVerbProgressDoc,
  SessionComposition,
  SessionProgressPatch,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import { getAdminFirestore } from '@/shared/infrastructure/firebase/adminFirestore';

const generateExerciseService = new GeminiPracticeExerciseService();
const AI_GENERATION_TIMEOUT_MS = 25000;
const SRS_PROGRESS_DOC_ID = 'phrasalVerbsProgress';
const SRS_SCHEMA_VERSION = 1;

const generatePracticeExerciseInputSchema = z.object({
  exerciseType: practiceExerciseTypeSchema,
  phrasalVerbs: practiceExerciseRequestSchema.shape.phrasalVerbs,
});

const exerciseResultSchema = z.object({
  pvId: z.string().min(1),
  phrasalVerb: z.string().min(1),
  exerciseType: practiceExerciseTypeSchema,
  isCorrect: z.boolean(),
  answeredAt: z.number().int().positive(),
  userAnswer: z.union([z.string(), z.number()]).optional(),
  correctAnswer: z.string().min(1),
});

const sessionCompositionSchema = z.object({
  failed: z.number().int().min(0),
  review: z.number().int().min(0),
  new: z.number().int().min(0),
  total: z.number().int().min(0),
});

const completeSrsSessionInputSchema = z.object({
  sessionId: z.string().min(1).optional(),
  results: z.array(exerciseResultSchema).min(1),
  sessionDurationSeconds: z.number().int().min(0),
  composition: sessionCompositionSchema,
  startedAt: z.number().int().positive(),
  completedAt: z.number().int().positive(),
});

const flushPendingInputSchema = z.object({
  sessions: z
    .array(
      z.object({
        sessionId: z.string().min(1),
        results: z.array(exerciseResultSchema).min(1),
        sessionDurationSeconds: z.number().int().min(0),
        composition: sessionCompositionSchema,
        startedAt: z.number().int().positive(),
        completedAt: z.number().int().positive(),
      }),
    )
    .min(1),
});

export interface GeneratePracticeExerciseResult {
  success: boolean;
  exercise?: PracticeExercise;
  error?: string;
  details?: string;
}

export interface InitializeSrsProgressResult {
  success: boolean;
  snapshot?: PhrasalVerbProgressDoc;
  error?: string;
  details?: string;
}

export interface CompleteSessionInput {
  sessionId?: string;
  results: ExerciseResult[];
  sessionDurationSeconds: number;
  composition: SessionComposition;
  startedAt: number;
  completedAt: number;
}

export interface CompleteSessionResult {
  success: boolean;
  sessionId?: string;
  updatedMeta?: PhrasalVerbProgressDoc['meta'];
  updatedProgressByPvId?: SessionProgressPatch[];
  pendingStored?: boolean;
  error?: string;
  details?: string;
}

export interface FlushPendingInput {
  sessions: Array<{
    sessionId: string;
    results: ExerciseResult[];
    sessionDurationSeconds: number;
    composition: SessionComposition;
    startedAt: number;
    completedAt: number;
  }>;
}

export interface FlushPendingResult {
  success: boolean;
  processedSessionIds: string[];
  failedSessionIds: string[];
  error?: string;
  details?: string;
}

function createInitialProgressDoc(nowMs: number): PhrasalVerbProgressDoc {
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

function normalizeProgressDoc(rawData: unknown, nowMs: number): PhrasalVerbProgressDoc {
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

function toLocalProgressRow(
  pvId: string,
  compact: PhrasalVerbProgressCompactEntry,
  updatedAt: number,
): LocalPhrasalVerbProgressRow {
  return {
    pvId,
    status: compact.s,
    easeFactor: compact.e,
    interval: compact.i,
    repetitions: compact.rp,
    nextReview: compact.nr,
    lastReview: compact.lr,
    timesCorrect: compact.tc,
    timesIncorrect: compact.ti,
    timesViewed: compact.tv,
    updatedAt,
  };
}

function toCompactEntry(output: ReturnType<typeof calculateSrsUpdate>, nowMs: number): PhrasalVerbProgressCompactEntry {
  return {
    s: output.status,
    e: output.easeFactor,
    i: output.interval,
    rp: output.repetitions,
    nr: output.nextReview,
    lr: nowMs,
    tc: output.timesCorrect,
    ti: output.timesIncorrect,
    tv: output.timesViewed,
  };
}

function dedupeByPvId(results: ExerciseResult[]): ExerciseResult[] {
  const map = new Map<string, ExerciseResult>();

  results.forEach((result) => {
    const previous = map.get(result.pvId);

    if (!previous || previous.answeredAt <= result.answeredAt) {
      map.set(result.pvId, result);
    }
  });

  return Array.from(map.values());
}

async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error('Usuario no autenticado.');
  }

  return userId;
}

async function applySessionCompletion(params: {
  userId: string;
  input: Omit<CompleteSessionInput, 'sessionId'>;
}): Promise<{
  updatedMeta: PhrasalVerbProgressDoc['meta'];
  updatedProgressByPvId: SessionProgressPatch[];
}> {
  const db = getAdminFirestore();
  const progressRef = db
    .collection('users')
    .doc(params.userId)
    .collection('learning')
    .doc(SRS_PROGRESS_DOC_ID);

  let transactionResult: {
    updatedMeta: PhrasalVerbProgressDoc['meta'];
    updatedProgressByPvId: SessionProgressPatch[];
  } | null = null;

  await db.runTransaction(async (transaction) => {
    const progressSnapshot = await transaction.get(progressRef);

    const nowMs = params.input.completedAt;
    const currentDoc = progressSnapshot.exists
      ? normalizeProgressDoc(progressSnapshot.data(), nowMs)
      : createInitialProgressDoc(nowMs);

    const uniqueResults = dedupeByPvId(params.input.results);
    const allResults = params.input.results;
    const sessionCorrectCount = allResults.filter((result) => result.isCorrect).length;
    const sessionIncorrectCount = allResults.length - sessionCorrectCount;
    const nextProgress = { ...currentDoc.progress };
    const updatedProgressByPvId: SessionProgressPatch[] = [];

    let newViewed = 0;
    let newMastered = 0;

    uniqueResults.forEach((result) => {
      const currentCompact = currentDoc.progress[result.pvId] ?? null;
      const currentProgress = currentCompact
        ? toLocalProgressRow(result.pvId, currentCompact, nowMs)
        : null;

      const update = calculateSrsUpdate({
        pvId: result.pvId,
        currentProgress,
        isCorrect: result.isCorrect,
        nowMs,
      });

      const compact = toCompactEntry(update, nowMs);
      nextProgress[result.pvId] = compact;
      updatedProgressByPvId.push({
        pvId: result.pvId,
        value: compact,
      });

      if (update.isFirstView) {
        newViewed += 1;
      }

      if (update.justMastered) {
        newMastered += 1;
      }
    });

    const nextStreak = calculateNewStreak(
      {
        currentStreak: currentDoc.meta.currentStreak,
        longestStreak: currentDoc.meta.longestStreak,
        lastSessionAt: currentDoc.meta.lastSessionAt,
      },
      nowMs,
    );

    const nextMeta: PhrasalVerbProgressDoc['meta'] = {
      totalViewed: currentDoc.meta.totalViewed + newViewed,
      totalMastered: currentDoc.meta.totalMastered + newMastered,
      currentStreak: nextStreak.currentStreak,
      longestStreak: nextStreak.longestStreak,
      lastSessionAt: nowMs,
      analytics: {
        totalSessions: currentDoc.meta.analytics.totalSessions + 1,
        totalExercises: currentDoc.meta.analytics.totalExercises + allResults.length,
        totalCorrect: currentDoc.meta.analytics.totalCorrect + sessionCorrectCount,
        totalIncorrect: currentDoc.meta.analytics.totalIncorrect + sessionIncorrectCount,
        averageAccuracy: 0,
        totalTimeSeconds:
          currentDoc.meta.analytics.totalTimeSeconds + params.input.sessionDurationSeconds,
        firstSessionAt: currentDoc.meta.analytics.firstSessionAt ?? nowMs,
      },
      lastSyncAt: nowMs,
      version: SRS_SCHEMA_VERSION,
    };

    const totalAnswered = nextMeta.analytics.totalCorrect + nextMeta.analytics.totalIncorrect;
    nextMeta.analytics.averageAccuracy =
      totalAnswered === 0
        ? 0
        : Math.round((nextMeta.analytics.totalCorrect / totalAnswered) * 100);

    transaction.set(progressRef, {
      progress: nextProgress,
      meta: nextMeta,
    });

    transactionResult = {
      updatedMeta: nextMeta,
      updatedProgressByPvId,
    };
  });

  if (!transactionResult) {
    throw new Error('No se pudo aplicar la sesión SRS.');
  }

  return transactionResult;
}

export async function generatePracticeExerciseAction(
  exerciseType: PracticeExerciseType,
  phrasalVerbs: PracticeExercisePhrasalVerbInput[],
): Promise<GeneratePracticeExerciseResult> {
  try {
    console.info('[generatePracticeExerciseAction] start', {
      exerciseType,
      pvCount: phrasalVerbs.length,
      pvIds: phrasalVerbs.map((pv) => pv.id),
    });

    if (!process.env.GEMINI_API_KEY) {
      console.error('[generatePracticeExerciseAction] Missing GEMINI_API_KEY');
      return {
        success: false,
        error: 'Missing GEMINI_API_KEY on server environment.',
      };
    }

    const parsedInput = generatePracticeExerciseInputSchema.parse({
      exerciseType,
      phrasalVerbs,
    });

    const exercise = await Promise.race([
      generateExerciseService.generateExercise(
        parsedInput.exerciseType,
        parsedInput.phrasalVerbs,
      ),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('The AI request timed out.'));
        }, AI_GENERATION_TIMEOUT_MS);
      }),
    ]);

    console.info('[generatePracticeExerciseAction] success', {
      requestedType: exerciseType,
      itemCount: exercise.items.length,
      exerciseType: exercise.exerciseType,
    });

    return {
      success: true,
      exercise,
    };
  } catch (error) {
    console.error('[generatePracticeExerciseAction] Failed to generate exercise', {
      exerciseType,
      pvCount: phrasalVerbs.length,
      error,
    });

    return {
      success: false,
      error: 'Failed to generate the exercise.',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function initializeSrsProgressAction(): Promise<InitializeSrsProgressResult> {
  try {
    const userId = await requireCurrentUserId();
    const nowMs = Date.now();
    const db = getAdminFirestore();

    const progressRef = db
      .collection('users')
      .doc(userId)
      .collection('learning')
      .doc(SRS_PROGRESS_DOC_ID);

    const snapshot = await progressRef.get();

    if (!snapshot.exists) {
      const initialDoc = createInitialProgressDoc(nowMs);
      await progressRef.set(initialDoc);

      return {
        success: true,
        snapshot: initialDoc,
      };
    }

    return {
      success: true,
      snapshot: normalizeProgressDoc(snapshot.data(), nowMs),
    };
  } catch (error) {
    console.error('[initializeSrsProgressAction] Failed', { error });

    return {
      success: false,
      error: 'No se pudo inicializar el progreso SRS.',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getSrsProgressSnapshotAction(): Promise<InitializeSrsProgressResult> {
  return initializeSrsProgressAction();
}

export async function completeSrsSessionAction(
  input: CompleteSessionInput,
): Promise<CompleteSessionResult> {
  try {
    const userId = await requireCurrentUserId();
    const parsedInput = completeSrsSessionInputSchema.parse(input);
    const sessionId = parsedInput.sessionId?.trim() || randomUUID();

    const completed = await applySessionCompletion({
      userId,
      input: {
        results: parsedInput.results,
        sessionDurationSeconds: parsedInput.sessionDurationSeconds,
        composition: parsedInput.composition,
        startedAt: parsedInput.startedAt,
        completedAt: parsedInput.completedAt,
      },
    });

    revalidatePath('/phrasal-verbs');
    revalidatePath('/phrasal-verbs/practice');
    revalidatePath('/phrasal-verbs/progress');

    return {
      success: true,
      sessionId,
      updatedMeta: completed.updatedMeta,
      updatedProgressByPvId: completed.updatedProgressByPvId,
      pendingStored: false,
    };
  } catch (error) {
    console.error('[completeSrsSessionAction] Failed', { error, input });

    return {
      success: false,
      pendingStored: true,
      error: 'No se pudo guardar la sesión SRS.',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function flushPendingSrsSessionsAction(
  input: FlushPendingInput,
): Promise<FlushPendingResult> {
  try {
    const userId = await requireCurrentUserId();
    const parsedInput = flushPendingInputSchema.parse(input);

    const processedSessionIds: string[] = [];
    const failedSessionIds: string[] = [];

    for (const session of parsedInput.sessions) {
      try {
        await applySessionCompletion({
          userId,
          input: {
            results: session.results,
            sessionDurationSeconds: session.sessionDurationSeconds,
            composition: session.composition,
            startedAt: session.startedAt,
            completedAt: session.completedAt,
          },
        });

        processedSessionIds.push(session.sessionId);
      } catch (error) {
        console.error('[flushPendingSrsSessionsAction] Failed to flush session', {
          sessionId: session.sessionId,
          error,
        });
        failedSessionIds.push(session.sessionId);
      }
    }

    revalidatePath('/phrasal-verbs');
    revalidatePath('/phrasal-verbs/practice');
    revalidatePath('/phrasal-verbs/progress');

    return {
      success: failedSessionIds.length === 0,
      processedSessionIds,
      failedSessionIds,
      error:
        failedSessionIds.length > 0
          ? 'Algunas sesiones pendientes no se pudieron sincronizar.'
          : undefined,
    };
  } catch (error) {
    console.error('[flushPendingSrsSessionsAction] Failed', { error });

    return {
      success: false,
      processedSessionIds: [],
      failedSessionIds: [],
      error: 'No se pudieron sincronizar las sesiones pendientes.',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
