'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import { CircleCheckBig, CircleX, Flag, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import { filterPhrasalVerbs } from '@/features/phrasal-verbs/application/utils/phrasalVerbFilters';
import { FirestorePhrasalVerbRepository } from '@/features/phrasal-verbs/infrastructure/repositories/FirestorePhrasalVerbRepository';
import {
  practiceSessionStorage,
  type ActivePracticeSession,
  type PracticeSessionFilters,
} from '@/features/phrasal-verbs/infrastructure/storage/practiceSessionStorage';
import {
  type PracticeExercise,
  type PracticeExercisePhrasalVerbInput,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';
import { generateReadAndMarkMeaningExerciseAction } from '@/features/phrasal-verbs/presentation/actions';
import { Button } from '@/shared/presentation/components/ui/button';
import { Spinner } from '@/shared/presentation/components/ui/spinner';
import { cn } from '@/shared/presentation/utils';

interface PracticeSessionRunnerProps {
  superGroup: string | null;
  group: string | null;
  categories: string[];
}

type ExerciseSourcePhrasalVerb = Pick<
  PhrasalVerb,
  'id' | 'phrasalVerb' | 'meaning' | 'definition' | 'example'
>;

function shuffleArray<T>(entries: T[]): T[] {
  const next = [...entries];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }

  return next;
}

function toExerciseInput(
  phrasalVerbs: ExerciseSourcePhrasalVerb[]
): PracticeExercisePhrasalVerbInput[] {
  return phrasalVerbs.map((pv) => ({
    id: pv.id,
    phrasalVerb: pv.phrasalVerb,
    meaning: pv.meaning,
    definition: pv.definition,
    example: pv.example,
  }));
}

function areSameFilters(a: PracticeSessionFilters, b: PracticeSessionFilters): boolean {
  if (a.categories.length !== b.categories.length) {
    return false;
  }

  const sortedA = [...a.categories].sort();
  const sortedB = [...b.categories].sort();

  return (
    a.superGroup === b.superGroup &&
    a.group === b.group &&
    sortedA.every((category, index) => category === sortedB[index])
  );
}

function createEmptySession(filters: PracticeSessionFilters): ActivePracticeSession {
  const nowIso = new Date().toISOString();

  return {
    version: 1,
    filters,
    usedPvIds: [],
    recentPvIds: [],
    currentExercise: null,
    answersByPvId: {},
    isValidated: false,
    totalQuestions: 0,
    totalCorrect: 0,
    incorrectByPvId: {},
    isFinished: false,
    startedAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

function pickPhrasalVerbsForExercise(
  phrasalVerbs: ExerciseSourcePhrasalVerb[],
  usedPvIds: string[],
  recentPvIds: string[]
): ExerciseSourcePhrasalVerb[] {
  const targetCount = Math.min(5, phrasalVerbs.length);
  if (targetCount === 0) {
    return [];
  }

  if (phrasalVerbs.length <= 5) {
    return shuffleArray(phrasalVerbs);
  }

  const usedSet = new Set(usedPvIds);
  const recentSet = new Set(recentPvIds);
  const picked: ExerciseSourcePhrasalVerb[] = [];
  const pickedIds = new Set<string>();

  const unseen = shuffleArray(phrasalVerbs.filter((pv) => !usedSet.has(pv.id)));
  for (const pv of unseen) {
    if (picked.length >= targetCount) {
      break;
    }

    picked.push(pv);
    pickedIds.add(pv.id);
  }

  if (picked.length < targetCount) {
    const nonRecent = shuffleArray(
      phrasalVerbs.filter(
        (pv) => !pickedIds.has(pv.id) && !recentSet.has(pv.id)
      )
    );

    for (const pv of nonRecent) {
      if (picked.length >= targetCount) {
        break;
      }

      picked.push(pv);
      pickedIds.add(pv.id);
    }
  }

  if (picked.length < targetCount) {
    const remaining = shuffleArray(phrasalVerbs.filter((pv) => !pickedIds.has(pv.id)));
    for (const pv of remaining) {
      if (picked.length >= targetCount) {
        break;
      }

      picked.push(pv);
      pickedIds.add(pv.id);
    }
  }

  return picked;
}

function sanitizeExercise(
  exercise: PracticeExercise,
  selectedPvIds: string[]
): PracticeExercise {
  const allowedPvIds = new Set(selectedPvIds);
  const sanitizedItems = exercise.items.filter((item) => allowedPvIds.has(item.pvId));

  if (sanitizedItems.length === 0) {
    throw new Error('The generated exercise did not include valid items.');
  }

  return {
    ...exercise,
    items: sanitizedItems,
  };
}

function getOptionStateClass(
  isValidated: boolean,
  selectedIndex: number | undefined,
  optionIndex: number,
  correctIndex: number
): string {
  if (!isValidated) {
    return selectedIndex === optionIndex
      ? 'border-primary bg-primary/10 text-foreground'
      : 'border-border bg-card hover:bg-muted';
  }

  if (optionIndex === correctIndex) {
    return 'border-emerald-700 bg-emerald-100 text-emerald-900';
  }

  if (selectedIndex === optionIndex && selectedIndex !== correctIndex) {
    return 'border-red-700 bg-red-100 text-red-900';
  }

  return 'border-border bg-card text-muted-foreground';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function markdownToPlainText(markdown: string): string {
  return markdown.replace(/\*\*/g, '').trim();
}

function hasValidSessionShape(session: ActivePracticeSession): boolean {
  if (!session.filters || !Array.isArray(session.filters.categories)) {
    return false;
  }

  if (!session.currentExercise) {
    return true;
  }

  return session.currentExercise.items.every(
    (item) => typeof item.sentenceMarkdown === 'string' && item.sentenceMarkdown.length > 0
  );
}

export function PracticeSessionRunner({
  superGroup,
  group,
  categories,
}: PracticeSessionRunnerProps): JSX.Element {
  const [phrasalVerbs, setPhrasalVerbs] = useState<PhrasalVerb[]>([]);
  const [isLoadingPhrasalVerbs, setIsLoadingPhrasalVerbs] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [session, setSession] = useState<ActivePracticeSession | null>(null);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const initializedSessionKeyRef = useRef<string | null>(null);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearGenerationWatchdog(): void {
    if (!generationTimeoutRef.current) {
      return;
    }

    clearTimeout(generationTimeoutRef.current);
    generationTimeoutRef.current = null;
  }

  function startGenerationWatchdog(context: string): void {
    clearGenerationWatchdog();
    generationTimeoutRef.current = setTimeout(() => {
      const message =
        'Exercise generation is taking too long. Please retry. Check server logs for details.';
      console.error('[PracticeSessionRunner] Generation watchdog timeout', {
        context,
        sessionKey,
      });
      setIsGeneratingExercise(false);
      setUiError(message);
      toast.error(message);
    }, 35000);
  }

  async function callActionWithTimeout(
    payload: PracticeExercisePhrasalVerbInput[]
  ): Promise<Awaited<ReturnType<typeof generateReadAndMarkMeaningExerciseAction>>> {
    return Promise.race([
      generateReadAndMarkMeaningExerciseAction(payload),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timed out waiting for exercise generation action response.'));
        }, 30000);
      }),
    ]);
  }

  useEffect(() => {
    const repository = new FirestorePhrasalVerbRepository();

    async function loadData(): Promise<void> {
      try {
        console.info('[PracticeSessionRunner] Loading phrasal verbs from Firestore');
        setIsLoadingPhrasalVerbs(true);
        setLoadError(null);
        const entries = await repository.getAllPhrasalVerbs();
        console.info('[PracticeSessionRunner] Firestore load success', {
          total: entries.length,
          superGroup,
          group,
          categories,
        });
        setPhrasalVerbs(entries);
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Could not load phrasal verbs for this category.'
        );
        console.error('Error loading practice session data', error);
        setLoadError(message);
        toast.error(message);
      } finally {
        setIsLoadingPhrasalVerbs(false);
      }
    }

    void loadData();
  }, []);

  useEffect(() => {
    return () => {
      clearGenerationWatchdog();
    };
  }, []);

  const categoryPhrasalVerbs = useMemo(
    () => filterPhrasalVerbs(phrasalVerbs, superGroup, group, categories),
    [phrasalVerbs, superGroup, group, categories]
  );

  const sourcePhrasalVerbs = useMemo<ExerciseSourcePhrasalVerb[]>(
    () =>
      categoryPhrasalVerbs.map((pv) => ({
        id: pv.id,
        phrasalVerb: pv.phrasalVerb,
        meaning: pv.meaning,
        definition: pv.definition,
        example: pv.example,
      })),
    [categoryPhrasalVerbs]
  );

  const filters = useMemo<PracticeSessionFilters>(
    () => ({
      superGroup,
      group,
      categories,
    }),
    [superGroup, group, categories]
  );

  const sessionKey = useMemo(
    () =>
      `${superGroup ?? 'none'}::${group ?? 'none'}::${[...categories].sort().join('|')}`,
    [superGroup, group, categories]
  );

  useEffect(() => {
    console.info('[PracticeSessionRunner] state snapshot', {
      sessionKey,
      isGeneratingExercise,
      hasSession: Boolean(session),
      hasCurrentExercise: Boolean(session?.currentExercise),
      isFinished: session?.isFinished ?? false,
      uiError,
    });
  }, [isGeneratingExercise, session, sessionKey, uiError]);

  const createNextExercise = useCallback(
    async (baseSession: ActivePracticeSession): Promise<ActivePracticeSession> => {
      console.info('[PracticeSessionRunner] createNextExercise:start', {
        usedCount: baseSession.usedPvIds.length,
        recentCount: baseSession.recentPvIds.length,
        sourcePool: sourcePhrasalVerbs.length,
      });

      const pickedPhrasalVerbs = pickPhrasalVerbsForExercise(
        sourcePhrasalVerbs,
        baseSession.usedPvIds,
        baseSession.recentPvIds
      );

      console.info('[PracticeSessionRunner] createNextExercise:picked', {
        pickedCount: pickedPhrasalVerbs.length,
        pickedPvIds: pickedPhrasalVerbs.map((pv) => pv.id),
      });

      if (pickedPhrasalVerbs.length === 0) {
        throw new Error('No phrasal verbs are available for this exercise.');
      }

      const selectedPvIds = pickedPhrasalVerbs.map((pv) => pv.id);
      const inputPayload = toExerciseInput(pickedPhrasalVerbs);
      const response = await callActionWithTimeout(inputPayload);

      console.info('[PracticeSessionRunner] createNextExercise:actionResponse', {
        success: response.success,
        hasExercise: Boolean(response.exercise),
        error: response.error,
        details: response.details,
      });

      if (!response.success || !response.exercise) {
        throw new Error(response.details ?? response.error ?? 'Could not generate exercise.');
      }

      const sanitizedExercise = sanitizeExercise(response.exercise, selectedPvIds);
      console.info('[PracticeSessionRunner] createNextExercise:sanitized', {
        items: sanitizedExercise.items.length,
        pvIds: sanitizedExercise.items.map((item) => item.pvId),
      });
      const nowIso = new Date().toISOString();

      return {
        ...baseSession,
        usedPvIds: Array.from(new Set([...baseSession.usedPvIds, ...selectedPvIds])),
        recentPvIds: selectedPvIds,
        currentExercise: sanitizedExercise,
        answersByPvId: {},
        isValidated: false,
        isFinished: false,
        updatedAtIso: nowIso,
      };
    },
    [sourcePhrasalVerbs]
  );

  useEffect(() => {
    if (categories.length === 0 || isLoadingPhrasalVerbs || loadError || sourcePhrasalVerbs.length === 0) {
      return;
    }

    if (initializedSessionKeyRef.current === sessionKey) {
      console.info('[PracticeSessionRunner] Initialization already completed for key', {
        sessionKey,
      });
      return;
    }

    let isCancelled = false;

    async function initializeSession(): Promise<void> {
      setUiError(null);

      const restoredSession = practiceSessionStorage.getActiveSession();
      if (restoredSession && !hasValidSessionShape(restoredSession)) {
        console.warn('[PracticeSessionRunner] Discarding old session shape from localStorage');
        practiceSessionStorage.clearActiveSession();
      }

      const baseSession =
        restoredSession &&
        hasValidSessionShape(restoredSession) &&
        areSameFilters(restoredSession.filters, filters)
          ? restoredSession
          : createEmptySession(filters);

      if (!isCancelled) {
        setSession(baseSession);
      }

      if (baseSession.isFinished || baseSession.currentExercise) {
        console.info('[PracticeSessionRunner] Using restored session state', {
          isFinished: baseSession.isFinished,
          hasCurrentExercise: Boolean(baseSession.currentExercise),
        });
        initializedSessionKeyRef.current = sessionKey;
        return;
      }

      try {
        if (!isCancelled) {
          setIsGeneratingExercise(true);
          startGenerationWatchdog('initializeSession');
        }

        const nextSession = await createNextExercise(baseSession);
        if (!isCancelled) {
          setSession(nextSession);
          clearGenerationWatchdog();
          initializedSessionKeyRef.current = sessionKey;
        }
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Could not create the first exercise. Please try again.'
        );
        console.error('Failed to initialize practice session', error);
        if (!isCancelled) {
          setUiError(message);
          toast.error(message);
        }
      } finally {
        clearGenerationWatchdog();
        if (!isCancelled) {
          setIsGeneratingExercise(false);
        }
      }
    }

    void initializeSession();

    return () => {
      isCancelled = true;
    };
  }, [
    categories,
    createNextExercise,
    filters,
    isLoadingPhrasalVerbs,
    loadError,
    sessionKey,
    sourcePhrasalVerbs.length,
  ]);

  useEffect(() => {
    if (!session) {
      return;
    }

    practiceSessionStorage.saveActiveSession({
      ...session,
      updatedAtIso: new Date().toISOString(),
    });
  }, [session]);

  async function handleContinue(): Promise<void> {
    if (!session || !session.currentExercise || !session.isValidated) {
      return;
    }

    setUiError(null);
    setIsGeneratingExercise(true);
    startGenerationWatchdog('handleContinue');

    try {
      const nextSession = await createNextExercise(session);
      setSession(nextSession);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Could not generate the next exercise. Please try again.'
      );
      console.error('Failed to continue practice session', error);
      setUiError(message);
      toast.error(message);
    } finally {
      clearGenerationWatchdog();
      setIsGeneratingExercise(false);
    }
  }

  function handleSelectAnswer(pvId: string, meaningIndex: number): void {
    setUiError(null);

    setSession((previous) => {
      if (!previous || previous.isValidated || !previous.currentExercise) {
        return previous;
      }

      return {
        ...previous,
        answersByPvId: {
          ...previous.answersByPvId,
          [pvId]: meaningIndex,
        },
        updatedAtIso: new Date().toISOString(),
      };
    });
  }

  function handleValidate(): void {
    if (!session || !session.currentExercise || session.isValidated) {
      return;
    }

    const unanswered = session.currentExercise.items.some(
      (item) => session.answersByPvId[item.pvId] === undefined
    );

    if (unanswered) {
      const message = 'Please answer all statements before validating.';
      setUiError(message);
      toast.warning(message);
      return;
    }

    setUiError(null);

    let correctCount = 0;
    const nextIncorrectByPvId = { ...session.incorrectByPvId };

    session.currentExercise.items.forEach((item) => {
      const selectedMeaningIndex = session.answersByPvId[item.pvId];
      if (selectedMeaningIndex === item.correctMeaningIndex) {
        correctCount += 1;
        return;
      }

      const currentRecord = nextIncorrectByPvId[item.pvId];
      nextIncorrectByPvId[item.pvId] = {
        pvId: item.pvId,
        phrasalVerb: item.phrasalVerb,
        wrongCount: (currentRecord?.wrongCount ?? 0) + 1,
        lastSentence: markdownToPlainText(item.sentenceMarkdown),
        correctMeaning: item.meanings[item.correctMeaningIndex],
      };
    });

    setSession({
      ...session,
      isValidated: true,
      totalQuestions: session.totalQuestions + session.currentExercise.items.length,
      totalCorrect: session.totalCorrect + correctCount,
      incorrectByPvId: nextIncorrectByPvId,
      updatedAtIso: new Date().toISOString(),
    });
  }

  function handleFinishSession(): void {
    setUiError(null);
    setSession((previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        isFinished: true,
        currentExercise: null,
        answersByPvId: {},
        isValidated: false,
        updatedAtIso: new Date().toISOString(),
      };
    });
  }

  async function handleRestartSession(): Promise<void> {
    setUiError(null);
    setIsGeneratingExercise(true);
    startGenerationWatchdog('handleRestartSession');

    const freshSession = createEmptySession(filters);
    setSession(freshSession);

    try {
      const nextSession = await createNextExercise(freshSession);
      setSession(nextSession);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Could not start a new session. Please try again.'
      );
      console.error('Failed to restart practice session', error);
      setUiError(message);
      toast.error(message);
    } finally {
      clearGenerationWatchdog();
      setIsGeneratingExercise(false);
    }
  }

  async function handleRetryGenerateExercise(): Promise<void> {
    if (!session) {
      return;
    }

    setUiError(null);
    setIsGeneratingExercise(true);
    startGenerationWatchdog('handleRetryGenerateExercise');

    try {
      const nextSession = await createNextExercise(session);
      setSession(nextSession);
      toast.success('Exercise generated successfully.');
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Could not generate the exercise. Please try again.'
      );
      setUiError(message);
      toast.error(message);
    } finally {
      clearGenerationWatchdog();
      setIsGeneratingExercise(false);
    }
  }

  const currentExercise = session?.currentExercise;
  const totalAccuracy =
    session && session.totalQuestions > 0
      ? Math.round((session.totalCorrect / session.totalQuestions) * 100)
      : 0;

  const incorrectPhrasalVerbs = useMemo(
    () =>
      session
        ? Object.values(session.incorrectByPvId).sort(
            (a, b) => b.wrongCount - a.wrongCount
          )
        : [],
    [session]
  );

  if (categories.length === 0) {
    return (
      <div className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
        <p className='font-bold'>No categories were provided for this practice session.</p>
      </div>
    );
  }

  if (isLoadingPhrasalVerbs) {
    return (
      <div className='flex items-center justify-center rounded-[10px] border-2 border-border bg-card p-12 shadow-[6px_6px_0_0_var(--color-border)]'>
        <Spinner className='mr-2 h-5 w-5' />
        <p className='font-semibold'>Loading practice session...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className='rounded-[10px] border-2 border-border bg-destructive/10 p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
        <p className='font-bold text-destructive'>{loadError}</p>
      </div>
    );
  }

  if (sourcePhrasalVerbs.length === 0) {
    return (
      <section className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <h2 className='mb-2 text-xl font-black'>No phrasal verbs found</h2>
        <p className='font-medium text-muted-foreground'>
          These categories have no phrasal verbs available for practice.
        </p>
      </section>
    );
  }

  if (!session) {
    return (
      <div className='flex items-center justify-center rounded-[10px] border-2 border-border bg-card p-12 shadow-[6px_6px_0_0_var(--color-border)]'>
        <Spinner className='mr-2 h-5 w-5' />
        <p className='font-semibold'>Preparing your session...</p>
      </div>
    );
  }

  if (session.isFinished) {
    return (
      <section className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-black text-foreground'>Session completed</h2>
            <p className='font-medium text-muted-foreground'>
              Categories: <strong>{categories.join(', ')}</strong>
            </p>
          </div>
          <Button variant='outline' onClick={handleRestartSession} disabled={isGeneratingExercise}>
            <RotateCcw className='h-4 w-4' />
            Start new session
          </Button>
        </div>

        <div className='mb-6 grid gap-3 md:grid-cols-3'>
          <div className='rounded-[8px] border-2 border-border bg-muted p-4'>
            <p className='text-xs font-black uppercase text-muted-foreground'>Questions</p>
            <p className='text-3xl font-black'>{session.totalQuestions}</p>
          </div>
          <div className='rounded-[8px] border-2 border-border bg-emerald-100 p-4'>
            <p className='text-xs font-black uppercase text-emerald-900'>Correct</p>
            <p className='text-3xl font-black text-emerald-900'>{session.totalCorrect}</p>
          </div>
          <div className='rounded-[8px] border-2 border-border bg-secondary p-4'>
            <p className='text-xs font-black uppercase text-secondary-foreground'>Accuracy</p>
            <p className='text-3xl font-black text-secondary-foreground'>{totalAccuracy}%</p>
          </div>
        </div>

        <div className='rounded-[8px] border-2 border-border bg-muted p-4'>
          <h3 className='mb-3 text-lg font-black'>Phrasal verbs with mistakes</h3>
          {incorrectPhrasalVerbs.length === 0 ? (
            <p className='font-medium text-emerald-800'>Great job! You had no mistakes.</p>
          ) : (
            <ul className='space-y-3'>
              {incorrectPhrasalVerbs.map((entry) => (
                <li key={entry.pvId} className='rounded-[6px] border-2 border-border bg-card p-3'>
                  <p className='font-black text-foreground'>{entry.phrasalVerb}</p>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Mistakes: <strong>{entry.wrongCount}</strong>
                  </p>
                  <p className='mt-1 text-sm font-medium text-muted-foreground'>
                    Last sentence: {entry.lastSentence}
                  </p>
                  <p className='text-sm font-semibold text-foreground'>
                    Correct meaning: {entry.correctMeaning}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-black text-foreground'>Practice session</h2>
          <p className='font-medium text-muted-foreground'>
            Categories: <strong>{categories.join(', ')}</strong>
          </p>
          <p className='text-sm font-semibold text-muted-foreground'>
            Phrasal verbs in pool: {sourcePhrasalVerbs.length}
          </p>
        </div>

        <Button
          variant='outline'
          onClick={handleFinishSession}
          disabled={isGeneratingExercise}
          className='shrink-0'
        >
          <Flag className='h-4 w-4' />
          Finish session
        </Button>
      </div>

      {uiError && (
        <div className='mb-4 rounded-[8px] border-2 border-border bg-destructive/10 p-3'>
          <p className='font-bold text-destructive'>{uiError}</p>
        </div>
      )}

      {!currentExercise ? (
        <div className='flex items-center justify-center rounded-[8px] border-2 border-border bg-muted p-10'>
          {isGeneratingExercise ? (
            <>
              <Spinner className='mr-2 h-5 w-5' />
              <p className='font-semibold'>Generating exercise...</p>
            </>
          ) : (
            <div className='text-center'>
              <p className='mb-3 font-semibold'>Exercise could not be generated yet.</p>
              <Button onClick={() => void handleRetryGenerateExercise()}>
                Retry generating exercise
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className='mb-5 rounded-[8px] border-2 border-border bg-muted p-4'>
            <p className='text-xs font-black uppercase text-muted-foreground'>
              {currentExercise.exerciseType.replaceAll('_', ' ')}
            </p>
            <h3 className='text-xl font-black text-foreground'>{currentExercise.title}</h3>
            <p className='font-medium text-muted-foreground'>{currentExercise.instructions}</p>
          </div>

          <ul className='space-y-4'>
            {currentExercise.items.map((item, itemIndex) => {
              const selectedIndex = session.answersByPvId[item.pvId];
              const isCorrect = selectedIndex === item.correctMeaningIndex;

              return (
                <li
                  key={`${item.pvId}-${itemIndex}`}
                  className='rounded-[8px] border-2 border-border bg-card p-4'
                >
                  <p className='mb-1 text-xs font-black uppercase text-muted-foreground'>
                    {itemIndex + 1}. {item.phrasalVerb}
                  </p>
                  <div className='mb-3 text-base font-semibold text-foreground'>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p>{children}</p>,
                        strong: ({ children }) => (
                          <strong className='rounded-[4px] bg-primary/15 px-1 text-primary'>
                            {children}
                          </strong>
                        ),
                      }}
                    >
                      {item.sentenceMarkdown}
                    </ReactMarkdown>
                  </div>

                  <div className='space-y-2'>
                    {item.meanings.map((meaning, meaningIndex) => {
                      const optionStateClass = getOptionStateClass(
                        session.isValidated,
                        selectedIndex,
                        meaningIndex,
                        item.correctMeaningIndex
                      );

                      return (
                        <button
                          key={`${item.pvId}-${meaningIndex}`}
                          type='button'
                          onClick={() => handleSelectAnswer(item.pvId, meaningIndex)}
                          disabled={session.isValidated || isGeneratingExercise}
                          className={cn(
                            'w-full rounded-[6px] border-2 px-3 py-2 text-left text-sm font-semibold transition-colors',
                            optionStateClass
                          )}
                        >
                          {meaning}
                        </button>
                      );
                    })}
                  </div>

                  {session.isValidated && (
                    <div className='mt-3'>
                      {isCorrect ? (
                        <p className='inline-flex items-center gap-2 text-sm font-black text-emerald-800'>
                          <CircleCheckBig className='h-4 w-4' />
                          Correct
                        </p>
                      ) : (
                        <div>
                          <p className='inline-flex items-center gap-2 text-sm font-black text-red-800'>
                            <CircleX className='h-4 w-4' />
                            Incorrect
                          </p>
                          <p className='text-sm font-medium text-foreground'>
                            Correct meaning: {item.meanings[item.correctMeaningIndex]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className='mt-6 flex flex-wrap items-center justify-between gap-3'>
            <div className='text-sm font-semibold text-muted-foreground'>
              Score: {session.totalCorrect}/{session.totalQuestions} ({totalAccuracy}%)
            </div>

            {!session.isValidated ? (
              <Button onClick={handleValidate} disabled={isGeneratingExercise}>
                Validate
              </Button>
            ) : (
              <Button onClick={() => void handleContinue()} disabled={isGeneratingExercise}>
                {isGeneratingExercise ? (
                  <>
                    <Spinner className='h-4 w-4' />
                    Generating...
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
