'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUserId } from '@/features/auth/presentation/actions';
import { calculateSrsUpdate } from '@/features/phrasal-verbs/application/services/SrsAlgorithm.service';
import { calculateNewStreak } from '@/features/phrasal-verbs/application/services/StreakManager.service';
import {
  createInitialProgressDoc,
  normalizeProgressDoc,
  SRS_PROGRESS_DOC_ID,
  SRS_SCHEMA_VERSION,
} from '@/features/phrasal-verbs/application/services/progressSnapshot';
import { GeminiPracticeExerciseService } from '@/features/phrasal-verbs/infrastructure/services/GeminiPracticeExerciseService';
import {
  practiceExerciseTypeSchema,
  practiceExerciseRequestSchema,
  type PracticeExercise,
  type PracticeExercisePhrasalVerbInput,
  type PracticeExerciseRecentUsage,
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

const generatePracticeExerciseInputSchema = z.object({
  exerciseType: practiceExerciseTypeSchema,
  phrasalVerbs: practiceExerciseRequestSchema.shape.phrasalVerbs,
  recentUsage: practiceExerciseRequestSchema.shape.recentUsage,
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

// Convert the SRS service output back into the compact Firestore shape used by
// the progress document.
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

// Multiple answers for the same phrasal verb can happen in a pending session
// flush. Only the latest answer should affect the final SRS update.
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

// Apply a full session atomically so counters, streaks, and per-verb state stay
// in sync even if two writes race.
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
  recentUsage: PracticeExerciseRecentUsage[] = [],
): Promise<GeneratePracticeExerciseResult> {
  try {
    console.info('[generatePracticeExerciseAction] start', {
      exerciseType,
      pvCount: phrasalVerbs.length,
      pvIds: phrasalVerbs.map((pv) => pv.id),
      recentUsageCount: recentUsage.length,
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
      recentUsage,
    });

    // Bound the AI call so the client can fall back to retry/pending behavior
    // instead of waiting indefinitely on a provider timeout.
    const exercise = await Promise.race([
      generateExerciseService.generateExercise(
        parsedInput.exerciseType,
        parsedInput.phrasalVerbs,
        parsedInput.recentUsage,
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
      recentUsageCount: recentUsage.length,
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
      // Mutations can eagerly create the progress document because the user has
      // already entered the authenticated practice flow.
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
  // Kept for compatibility with client flows that still import the action.
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
