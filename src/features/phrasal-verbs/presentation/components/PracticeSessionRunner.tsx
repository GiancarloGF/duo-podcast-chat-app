'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSX, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CircleCheckBig, CircleX, Flag, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import {
  practiceSessionStorage,
  type ActivePracticeSession,
  type PracticeSessionFilters,
} from '@/features/phrasal-verbs/infrastructure/storage/practiceSessionStorage';
import {
  type FillInGapsDragDropExercise,
  type MarkSentencesCorrectExercise,
  type PracticeExercise,
  type PracticeExercisePhrasalVerbInput,
  type PracticeExerciseType,
  type ReadAndMarkMeaningExercise,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';
import { generatePracticeExerciseAction } from '@/features/phrasal-verbs/presentation/actions';
import { usePhrasalVerbCatalog } from '@/features/phrasal-verbs/presentation/hooks/usePhrasalVerbCatalog';
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

const EXERCISE_ROTATION: PracticeExerciseType[] = [
  'read_and_mark_meaning',
  'mark_sentences_correct',
  'fill_in_gaps_drag_drop',
];

interface WordToken {
  id: string;
  text: string;
}

function shuffleArray<T>(entries: T[]): T[] {
  const next = [...entries];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [next[i], next[randomIndex]] = [next[randomIndex], next[i]];
  }

  return next;
}

function toExerciseInput(
  phrasalVerbs: ExerciseSourcePhrasalVerb[],
): PracticeExercisePhrasalVerbInput[] {
  return phrasalVerbs.map((pv) => ({
    id: pv.id,
    phrasalVerb: pv.phrasalVerb,
    meaning: pv.meaning,
    definition: pv.definition,
    example: pv.example,
  }));
}

function areSameFilters(
  a: PracticeSessionFilters,
  b: PracticeSessionFilters,
): boolean {
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

function createEmptySession(
  filters: PracticeSessionFilters,
): ActivePracticeSession {
  const nowIso = new Date().toISOString();

  return {
    version: 1,
    filters,
    usedPvIds: [],
    recentPvIds: [],
    exerciseOrder: getRandomExerciseOrder(),
    currentExerciseIndex: 0,
    currentExercise: null,
    answersByPvId: {},
    isValidated: false,
    generatedExercisesCount: 0,
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
  recentPvIds: string[],
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
        (pv) => !pickedIds.has(pv.id) && !recentSet.has(pv.id),
      ),
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
    const remaining = shuffleArray(
      phrasalVerbs.filter((pv) => !pickedIds.has(pv.id)),
    );
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

function getRandomExerciseOrder(): PracticeExerciseType[] {
  return shuffleArray(EXERCISE_ROTATION);
}

function sanitizeExercise(
  exercise: PracticeExercise,
  selectedPvIds: string[],
): PracticeExercise {
  const allowedPvIds = new Set(selectedPvIds);

  if (isReadAndMarkMeaningExercise(exercise)) {
    const sanitizedItems = exercise.items.filter((item) =>
      allowedPvIds.has(item.pvId),
    );

    if (sanitizedItems.length === 0) {
      throw new Error('The generated exercise did not include valid items.');
    }

    return {
      ...exercise,
      items: sanitizedItems,
    };
  }

  if (isMarkSentencesCorrectExercise(exercise)) {
    const sanitizedItems = exercise.items.filter((item) =>
      allowedPvIds.has(item.pvId),
    );

    if (sanitizedItems.length === 0) {
      throw new Error('The generated exercise did not include valid items.');
    }

    return {
      ...exercise,
      items: sanitizedItems,
    };
  }

  if (isFillInGapsDragDropExercise(exercise)) {
    const sanitizedItems = exercise.items.filter((item) =>
      allowedPvIds.has(item.pvId),
    );

    if (sanitizedItems.length === 0) {
      throw new Error('The generated exercise did not include valid items.');
    }

    const allowedPvIdSet = new Set(sanitizedItems.map((item) => item.pvId));
    const sanitizedWordBank = exercise.wordBank.filter((word) =>
      sanitizedItems.some(
        (item) =>
          item.correctWord.trim().toLowerCase() === word.trim().toLowerCase(),
      ),
    );

    if (sanitizedWordBank.length !== allowedPvIdSet.size) {
      throw new Error(
        'The generated fill-in-gaps exercise has inconsistent word bank.',
      );
    }

    return {
      ...exercise,
      items: sanitizedItems,
      wordBank: sanitizedWordBank,
    };
  }

  throw new Error('Unsupported exercise type.');
}

function isReadAndMarkMeaningExercise(
  exercise: PracticeExercise,
): exercise is ReadAndMarkMeaningExercise {
  return exercise.exerciseType === 'read_and_mark_meaning';
}

function isMarkSentencesCorrectExercise(
  exercise: PracticeExercise,
): exercise is MarkSentencesCorrectExercise {
  return exercise.exerciseType === 'mark_sentences_correct';
}

function isFillInGapsDragDropExercise(
  exercise: PracticeExercise,
): exercise is FillInGapsDragDropExercise {
  return exercise.exerciseType === 'fill_in_gaps_drag_drop';
}

function getOptionStateClass(
  isValidated: boolean,
  selectedIndex: number | undefined,
  optionIndex: number,
  correctIndex: number,
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

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function getExerciseTypeLabel(exerciseType: PracticeExerciseType): string {
  if (exerciseType === 'read_and_mark_meaning') {
    return 'Mark meaning';
  }

  if (exerciseType === 'mark_sentences_correct') {
    return 'Mark sentence';
  }

  return 'Fill gaps';
}

function hasValidSessionShape(session: ActivePracticeSession): boolean {
  if (!session.filters || !Array.isArray(session.filters.categories)) {
    return false;
  }

  if (typeof session.generatedExercisesCount !== 'number') {
    return false;
  }

  if (!Array.isArray(session.exerciseOrder)) {
    return false;
  }

  if (typeof session.currentExerciseIndex !== 'number') {
    return false;
  }

  if (session.exerciseOrder.length !== EXERCISE_ROTATION.length) {
    return false;
  }

  if (new Set(session.exerciseOrder).size !== EXERCISE_ROTATION.length) {
    return false;
  }

  if (!session.currentExercise) {
    return session.isFinished || session.generatedExercisesCount === 0;
  }

  if (isReadAndMarkMeaningExercise(session.currentExercise)) {
    return session.currentExercise.items.every(
      (item) =>
        typeof item.sentenceMarkdown === 'string' &&
        item.sentenceMarkdown.length > 0 &&
        item.meanings.length === 3,
    );
  }

  if (isMarkSentencesCorrectExercise(session.currentExercise)) {
    return session.currentExercise.items.every(
      (item) =>
        typeof item.firstSentenceMarkdown === 'string' &&
        item.firstSentenceMarkdown.length > 0 &&
        typeof item.secondSentenceMarkdown === 'string' &&
        item.secondSentenceMarkdown.length > 0,
    );
  }

  if (isFillInGapsDragDropExercise(session.currentExercise)) {
    return (
      session.currentExercise.items.every(
        (item) =>
          typeof item.sentencePrefix === 'string' &&
          item.sentencePrefix.length > 0 &&
          typeof item.sentenceSuffix === 'string' &&
          item.sentenceSuffix.length > 0 &&
          typeof item.correctWord === 'string' &&
          item.correctWord.length > 0,
      ) &&
      session.currentExercise.wordBank.length ===
        session.currentExercise.items.length
    );
  }

  return false;
}

interface DraggableWordTokenProps {
  id: string;
  text: string;
  disabled: boolean;
  isSelected: boolean;
  onTap: () => void;
}

function DraggableWordToken({
  id,
  text,
  disabled,
  isSelected,
  onTap,
}: DraggableWordTokenProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  });
  const touchTapHandledRef = useRef(false);

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <button
      type='button'
      ref={setNodeRef}
      style={style}
      onPointerUp={(event) => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        touchTapHandledRef.current = true;
        onTap();
      }}
      onClick={(event) => {
        event.stopPropagation();
        if (touchTapHandledRef.current) {
          touchTapHandledRef.current = false;
          return;
        }
        onTap();
      }}
      {...listeners}
      {...attributes}
      className={cn(
        'touch-manipulation select-none inline-flex rounded-[6px] border-2 border-border bg-card px-3 py-1 text-sm font-black text-foreground',
        isSelected && 'border-primary bg-primary/10 text-primary',
        disabled && 'cursor-not-allowed opacity-70',
      )}
    >
      {text}
    </button>
  );
}

interface DroppableWordSlotProps {
  id: string;
  className?: string;
  children: ReactNode;
}

function DroppableWordSlot({
  id,
  className,
  children,
}: DroppableWordSlotProps): JSX.Element {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && 'ring-2 ring-primary/70 ring-offset-2',
      )}
    >
      {children}
    </div>
  );
}

export function PracticeSessionRunner({
  superGroup,
  group,
  categories,
}: PracticeSessionRunnerProps): JSX.Element {
  const router = useRouter();
  const {
    hydration,
    status: catalogStatus,
    items: categoryPhrasalVerbs,
    retryHydration,
    reloadQuery,
  } = usePhrasalVerbCatalog({
    superGroup,
    group,
    categories,
    searchTerm: '',
    page: 1,
    pageSize: 2000,
    paginate: false,
  });
  const isCatalogHydrating =
    hydration.phase === 'checking' ||
    hydration.phase === 'downloading' ||
    hydration.phase === 'persisting';
  const hasLocalCatalogData = (catalogStatus?.localCount ?? 0) > 0;
  const isCatalogMissingAndBlocked =
    hydration.phase === 'error' &&
    !hasLocalCatalogData &&
    categoryPhrasalVerbs.length === 0;

  const [session, setSession] = useState<ActivePracticeSession | null>(null);
  const [isGeneratingExercise, setIsGeneratingExercise] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);
  const [selectedWordForTap, setSelectedWordForTap] = useState<string | null>(
    null,
  );
  const initializedSessionKeyRef = useRef<string | null>(null);
  const generationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
    exerciseType: PracticeExerciseType,
    payload: PracticeExercisePhrasalVerbInput[],
  ): Promise<Awaited<ReturnType<typeof generatePracticeExerciseAction>>> {
    return Promise.race([
      generatePracticeExerciseAction(exerciseType, payload),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Timed out waiting for exercise generation action response.',
            ),
          );
        }, 30000);
      }),
    ]);
  }

  useEffect(() => {
    return () => {
      clearGenerationWatchdog();
    };
  }, []);

  const sourcePhrasalVerbs = useMemo<ExerciseSourcePhrasalVerb[]>(
    () =>
      categoryPhrasalVerbs.map((pv) => ({
        id: pv.id,
        phrasalVerb: pv.phrasalVerb,
        meaning: pv.meaning,
        definition: pv.definition,
        example: pv.example,
      })),
    [categoryPhrasalVerbs],
  );

  const filters = useMemo<PracticeSessionFilters>(
    () => ({
      superGroup,
      group,
      categories,
    }),
    [superGroup, group, categories],
  );

  const sessionKey = useMemo(
    () =>
      `${superGroup ?? 'none'}::${group ?? 'none'}::${[...categories].sort().join('|')}`,
    [superGroup, group, categories],
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
    async (
      baseSession: ActivePracticeSession,
    ): Promise<ActivePracticeSession> => {
      const exerciseType =
        baseSession.exerciseOrder[baseSession.currentExerciseIndex];
      if (!exerciseType) {
        throw new Error('No exercise type available for current session step.');
      }

      console.info('[PracticeSessionRunner] createNextExercise:start', {
        exerciseType,
        currentExerciseIndex: baseSession.currentExerciseIndex,
        usedCount: baseSession.usedPvIds.length,
        recentCount: baseSession.recentPvIds.length,
        sourcePool: sourcePhrasalVerbs.length,
      });

      const pickedPhrasalVerbs = pickPhrasalVerbsForExercise(
        sourcePhrasalVerbs,
        baseSession.usedPvIds,
        baseSession.recentPvIds,
      );

      if (pickedPhrasalVerbs.length === 0) {
        throw new Error('No phrasal verbs are available for this exercise.');
      }

      const selectedPvIds = pickedPhrasalVerbs.map((pv) => pv.id);
      const response = await callActionWithTimeout(
        exerciseType,
        toExerciseInput(pickedPhrasalVerbs),
      );

      if (!response.success || !response.exercise) {
        throw new Error(
          response.details ?? response.error ?? 'Could not generate exercise.',
        );
      }

      const sanitizedExercise = sanitizeExercise(
        response.exercise,
        selectedPvIds,
      );

      const nowIso = new Date().toISOString();

      return {
        ...baseSession,
        usedPvIds: Array.from(
          new Set([...baseSession.usedPvIds, ...selectedPvIds]),
        ),
        recentPvIds: selectedPvIds,
        currentExercise: sanitizedExercise,
        answersByPvId: {},
        isValidated: false,
        isFinished: false,
        generatedExercisesCount: Math.max(
          baseSession.generatedExercisesCount,
          baseSession.currentExerciseIndex + 1,
        ),
        updatedAtIso: nowIso,
      };
    },
    [sourcePhrasalVerbs],
  );

  useEffect(() => {
    if (
      categories.length === 0 ||
      isCatalogHydrating ||
      isCatalogMissingAndBlocked ||
      sourcePhrasalVerbs.length === 0
    ) {
      return;
    }

    if (initializedSessionKeyRef.current === sessionKey) {
      console.info(
        '[PracticeSessionRunner] Initialization already completed for key',
        {
          sessionKey,
        },
      );
      return;
    }

    let isCancelled = false;

    async function initializeSession(): Promise<void> {
      setUiError(null);

      const restoredSession = practiceSessionStorage.getActiveSession();
      if (restoredSession && !hasValidSessionShape(restoredSession)) {
        console.warn(
          '[PracticeSessionRunner] Discarding old session shape from localStorage',
        );
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

      if (
        baseSession.isFinished ||
        (baseSession.currentExercise && baseSession.generatedExercisesCount > 0)
      ) {
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
          'Could not create the first exercise. Please try again.',
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
    isCatalogHydrating,
    isCatalogMissingAndBlocked,
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

    const nextIndex = session.currentExerciseIndex + 1;
    if (nextIndex >= session.exerciseOrder.length) {
      handleFinishSession();
      return;
    }

    setIsGeneratingExercise(true);
    startGenerationWatchdog('handleContinue');

    try {
      const nextSession = await createNextExercise({
        ...session,
        currentExerciseIndex: nextIndex,
        currentExercise: null,
        answersByPvId: {},
        isValidated: false,
      });
      setSession(nextSession);
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Could not generate the next exercise. Please try again.',
      );
      setUiError(message);
      toast.error(message);
    } finally {
      clearGenerationWatchdog();
      setIsGeneratingExercise(false);
    }
  }

  function handleSelectAnswer(
    pvId: string,
    selectedValue: number | string,
  ): void {
    setUiError(null);

    setSession((previous) => {
      if (!previous || previous.isValidated || !previous.currentExercise) {
        return previous;
      }

      return {
        ...previous,
        answersByPvId: {
          ...previous.answersByPvId,
          [pvId]: selectedValue,
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
      (item) => session.answersByPvId[item.pvId] === undefined,
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

    if (isReadAndMarkMeaningExercise(session.currentExercise)) {
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
          correctAnswer: item.meanings[item.correctMeaningIndex],
        };
      });
    } else if (isMarkSentencesCorrectExercise(session.currentExercise)) {
      session.currentExercise.items.forEach((item) => {
        const selectedSentenceIndex = session.answersByPvId[
          item.pvId
        ] as number;
        if (selectedSentenceIndex === item.correctSentenceIndex) {
          correctCount += 1;
          return;
        }

        const currentRecord = nextIncorrectByPvId[item.pvId];
        const correctSentence =
          item.correctSentenceIndex === 0
            ? item.firstSentenceMarkdown
            : item.secondSentenceMarkdown;

        nextIncorrectByPvId[item.pvId] = {
          pvId: item.pvId,
          phrasalVerb: item.phrasalVerb,
          wrongCount: (currentRecord?.wrongCount ?? 0) + 1,
          lastSentence: markdownToPlainText(correctSentence),
          correctAnswer: markdownToPlainText(correctSentence),
        };
      });
    } else {
      session.currentExercise.items.forEach((item) => {
        const selectedWord = session.answersByPvId[item.pvId];
        const isCorrect =
          typeof selectedWord === 'string' &&
          normalizeWord(selectedWord) === normalizeWord(item.correctWord);

        if (isCorrect) {
          correctCount += 1;
          return;
        }

        const currentRecord = nextIncorrectByPvId[item.pvId];
        const sentenceWithAnswer = `${item.sentencePrefix} ${item.correctWord} ${item.sentenceSuffix}`;
        nextIncorrectByPvId[item.pvId] = {
          pvId: item.pvId,
          phrasalVerb: item.phrasalVerb,
          wrongCount: (currentRecord?.wrongCount ?? 0) + 1,
          lastSentence: sentenceWithAnswer,
          correctAnswer: item.correctWord,
        };
      });
    }

    setSession({
      ...session,
      isValidated: true,
      totalQuestions:
        session.totalQuestions + session.currentExercise.items.length,
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
        currentExerciseIndex: previous.exerciseOrder.length,
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
        'Could not start a new session. Please try again.',
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
      const retrySession =
        session.currentExercise ||
        session.currentExerciseIndex >= session.exerciseOrder.length
          ? session
          : {
              ...session,
              currentExercise: null,
              answersByPvId: {},
              isValidated: false,
            };

      const nextSession = await createNextExercise(retrySession);
      setSession(nextSession);
      toast.success('Session exercises generated successfully.');
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Could not generate the exercise. Please try again.',
      );
      setUiError(message);
      toast.error(message);
    } finally {
      clearGenerationWatchdog();
      setIsGeneratingExercise(false);
    }
  }

  const currentExercise = session?.currentExercise;
  const sessionOrder =
    session && session.exerciseOrder.length === EXERCISE_ROTATION.length
      ? session.exerciseOrder
      : EXERCISE_ROTATION;

  useEffect(() => {
    setSelectedWordForTap(null);
  }, [currentExercise?.exerciseType, currentExercise?.items.length]);

  const totalAccuracy =
    session && session.totalQuestions > 0
      ? Math.round((session.totalCorrect / session.totalQuestions) * 100)
      : 0;

  const incorrectPhrasalVerbs = useMemo(
    () =>
      session
        ? Object.values(session.incorrectByPvId).sort(
            (a, b) => b.wrongCount - a.wrongCount,
          )
        : [],
    [session],
  );

  const fillExercise =
    currentExercise && isFillInGapsDragDropExercise(currentExercise)
      ? currentExercise
      : null;

  const assignedWordsByPvId = useMemo(() => {
    if (!session || !fillExercise) {
      return {} as Record<string, string>;
    }

    const entries = Object.entries(session.answersByPvId).filter(
      ([, value]) => typeof value === 'string',
    );

    return Object.fromEntries(entries) as Record<string, string>;
  }, [fillExercise, session]);

  const availableFillWords = useMemo(() => {
    if (!fillExercise) {
      return [] as WordToken[];
    }

    const assignedSet = new Set(Object.values(assignedWordsByPvId));
    return fillExercise.wordBank
      .filter((word) => !assignedSet.has(word))
      .map((word) => ({ id: word, text: word }));
  }, [assignedWordsByPvId, fillExercise]);

  const assignWordToBlank = useCallback(
    (word: string, targetPvId: string): void => {
      setSession((previous) => {
        if (!previous || previous.isValidated || !previous.currentExercise) {
          return previous;
        }

        if (!isFillInGapsDragDropExercise(previous.currentExercise)) {
          return previous;
        }

        const answers = { ...previous.answersByPvId } as Record<
          string,
          string | number
        >;
        const sourceEntry = Object.entries(answers).find(
          ([, value]) => value === word,
        );
        const sourcePvId = sourceEntry?.[0];
        const targetCurrent = answers[targetPvId];

        answers[targetPvId] = word;

        if (sourcePvId && sourcePvId !== targetPvId) {
          if (typeof targetCurrent === 'string') {
            answers[sourcePvId] = targetCurrent;
          } else {
            delete answers[sourcePvId];
          }
        }

        return {
          ...previous,
          answersByPvId: answers,
          updatedAtIso: new Date().toISOString(),
        };
      });
    },
    [],
  );

  const removeAssignedWord = useCallback((word: string): void => {
    setSession((previous) => {
      if (!previous || previous.isValidated || !previous.currentExercise) {
        return previous;
      }

      if (!isFillInGapsDragDropExercise(previous.currentExercise)) {
        return previous;
      }

      const answers = { ...previous.answersByPvId } as Record<
        string,
        string | number
      >;
      const sourceEntry = Object.entries(answers).find(
        ([, value]) => value === word,
      );

      if (!sourceEntry) {
        return previous;
      }

      delete answers[sourceEntry[0]];

      return {
        ...previous,
        answersByPvId: answers,
        updatedAtIso: new Date().toISOString(),
      };
    });
  }, []);

  function handleFillDragEnd(event: DragEndEvent): void {
    if (!session || session.isValidated || !fillExercise) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!activeId.startsWith('word:')) {
      return;
    }

    const word = activeId.replace('word:', '');

    if (!overId) {
      return;
    }

    if (overId === 'word-bank') {
      removeAssignedWord(word);
      return;
    }

    if (overId.startsWith('blank:')) {
      const pvId = overId.replace('blank:', '');
      assignWordToBlank(word, pvId);
    }
  }

  function handleWordChipTap(word: string): void {
    if (!fillExercise || !session || session.isValidated) {
      return;
    }

    if (selectedWordForTap === word) {
      setSelectedWordForTap(null);
      return;
    }

    setSelectedWordForTap(word);
  }

  function handleBlankTap(pvId: string): void {
    if (!fillExercise || !session || session.isValidated) {
      return;
    }

    const assignedWord = assignedWordsByPvId[pvId];

    if (selectedWordForTap) {
      if (assignedWord && assignedWord !== selectedWordForTap) {
        toast.warning('This gap is occupied. Remove the current word first.');
        return;
      }

      assignWordToBlank(selectedWordForTap, pvId);
      setSelectedWordForTap(null);
      return;
    }

    if (assignedWord) {
      removeAssignedWord(assignedWord);
    }
  }

  if (categories.length === 0) {
    return (
      <div className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
        <p className='font-bold'>
          No categories were provided for this practice session.
        </p>
      </div>
    );
  }

  if (isCatalogHydrating) {
    return (
      <div className='flex items-center justify-center rounded-[10px] border-2 border-border bg-card p-12 shadow-[6px_6px_0_0_var(--color-border)]'>
        <Spinner className='mr-2 h-5 w-5' />
        <p className='font-semibold'>{hydration.message}</p>
      </div>
    );
  }

  if (isCatalogMissingAndBlocked) {
    return (
      <div className='rounded-[10px] border-2 border-border bg-destructive/10 p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
        <p className='font-bold text-destructive'>
          No se pudo cargar el catalogo local para esta sesion.
        </p>
        <p className='mt-2 text-sm font-semibold text-destructive'>
          {hydration.error ?? hydration.message}
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => {
              retryHydration();
              reloadQuery();
            }}
          >
            Reintentar
          </Button>
          <Button variant='outline' onClick={() => router.push('/')}>
            Ir a inicio
          </Button>
        </div>
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
      <section className='rounded-[10px] border-2 border-border bg-card p-3 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <div className='mb-6 flex flex-wrap items-start justify-between gap-4'>
          <div>
            <h2 className='text-base sm:text-2xl font-black text-foreground'>
              Session completed
            </h2>
            <p className='font-medium text-muted-foreground'>
              Categories: <strong>{categories.join(', ')}</strong>
            </p>
          </div>
          <Button
            variant='outline'
            onClick={handleRestartSession}
            disabled={isGeneratingExercise}
          >
            <RotateCcw className='h-4 w-4' />
            Start new session
          </Button>
        </div>

        <div className='mb-6 grid gap-3 md:grid-cols-3'>
          <div className='rounded-xl border-2 border-border bg-muted p-4'>
            <p className='text-xs font-black uppercase text-muted-foreground'>
              Questions
            </p>
            <p className='text-3xl font-black'>{session.totalQuestions}</p>
          </div>
          <div className='rounded-xl border-2 border-border bg-emerald-100 p-4'>
            <p className='text-xs font-black uppercase text-emerald-900'>
              Correct
            </p>
            <p className='text-3xl font-black text-emerald-900'>
              {session.totalCorrect}
            </p>
          </div>
          <div className='rounded-xl border-2 border-border bg-secondary p-4'>
            <p className='text-xs font-black uppercase text-secondary-foreground'>
              Accuracy
            </p>
            <p className='text-3xl font-black text-secondary-foreground'>
              {totalAccuracy}%
            </p>
          </div>
        </div>

        <div className='rounded-xl border-2 border-border bg-muted p-4'>
          <h3 className='mb-3 text-lg font-black'>
            Phrasal verbs with mistakes
          </h3>
          {incorrectPhrasalVerbs.length === 0 ? (
            <p className='font-medium text-emerald-800'>
              Great job! You had no mistakes.
            </p>
          ) : (
            <ul className='space-y-3'>
              {incorrectPhrasalVerbs.map((entry) => (
                <li
                  key={entry.pvId}
                  className='rounded-[6px] border-2 border-border bg-card p-3'
                >
                  <p className='font-black text-foreground  text-lg sm:text-xl'>
                    {entry.phrasalVerb}
                  </p>
                  <p className='text-sm sm:text-base font-medium text-muted-foreground'>
                    Mistakes: <strong>{entry.wrongCount}</strong>
                  </p>
                  <p className='mt-1 text-sm sm:text-base font-medium text-muted-foreground'>
                    Last sentence: {entry.lastSentence}
                  </p>
                  <p className='text-sm sm:text-base font-semibold text-foreground'>
                    Correct answer: {entry.correctAnswer}
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
    <section className='rounded-[10px] border-2 border-border bg-card p-3 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
        <div>
          {/* <h2 className='text-2xl font-black text-foreground'>Practice session</h2> */}
          <p className='font-medium text-muted-foreground'>
            Categories: <strong>{categories.join(', ')}</strong>
          </p>
          <p className='text-sm font-semibold text-muted-foreground'>
            Phrasal verbs in pool: {sourcePhrasalVerbs.length}
          </p>
          <p className='text-sm font-semibold text-muted-foreground'>
            Exercise:{' '}
            {Math.min(
              (session.currentExerciseIndex ?? 0) + 1,
              sessionOrder.length,
            )}
            /{sessionOrder.length}
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

      {!currentExercise ? (
        <div className='flex items-center justify-center rounded-xl border-2 border-border bg-muted p-10'>
          {isGeneratingExercise ? (
            <>
              <Spinner className='mr-2 h-5 w-5' />
              <p className='font-semibold'>Generating exercise...</p>
            </>
          ) : (
            <div className='text-center'>
              <p className='mb-3 font-semibold'>
                Exercise could not be generated yet.
              </p>
              <Button onClick={() => void handleRetryGenerateExercise()}>
                Retry generating exercise
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className='mb-4 flex flex-wrap items-center gap-2'>
            {sessionOrder.map((exerciseType, index) => {
              const isCurrent = index === session.currentExerciseIndex;
              const isCompleted = index < session.currentExerciseIndex;

              return (
                <span
                  key={`${exerciseType}-${index}`}
                  className={cn(
                    'rounded-full border-2 px-3 py-1 text-sm font-black uppercase',
                    isCurrent && 'border-primary bg-primary/15 text-primary',
                    isCompleted &&
                      'border-emerald-700 bg-emerald-100 text-emerald-900',
                    !isCurrent &&
                      !isCompleted &&
                      'border-border bg-card text-muted-foreground',
                  )}
                >
                  {index + 1}. {getExerciseTypeLabel(exerciseType)}
                </span>
              );
            })}
          </div>

          <div className='mb-5 rounded-xl border-2 border-border bg-muted p-4'>
            <p className='text-xs sm:text-sm font-black uppercase text-muted-foreground'>
              {currentExercise.exerciseType.replaceAll('_', ' ')}
            </p>
            <h3 className='text-base sm:text-lg font-black text-foreground'>
              {currentExercise.title}
            </h3>
            <p className='text-sm sm:text-base font-medium text-muted-foreground'>
              {currentExercise.instructions}
            </p>
          </div>

          {isReadAndMarkMeaningExercise(currentExercise) ? (
            <ul className='space-y-4'>
              {currentExercise.items.map((item, itemIndex) => {
                const selectedIndex = session.answersByPvId[item.pvId] as
                  | number
                  | undefined;
                const isCorrect = selectedIndex === item.correctMeaningIndex;

                return (
                  <li
                    key={`${item.pvId}-${itemIndex}`}
                    className='rounded-xl border-2 border-border bg-[#f3ede0] p-4'
                  >
                    <p className='mb-1 text-xs font-black uppercase text-muted-foreground'>
                      Group {itemIndex + 1}
                    </p>
                    <div className='mb-3 text-base sm:text-lg font-semibold text-foreground italic'>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p>{children}</p>,
                          strong: ({ children }) => (
                            <strong className='rounded-lg bg-primary/15 px-1 text-primary'>
                              {children}
                            </strong>
                          ),
                        }}
                      >
                        {item.sentenceMarkdown}
                      </ReactMarkdown>
                    </div>

                    <div className='space-y-2'>
                      {item.meanings.map(
                        (meaning: string, meaningIndex: number) => {
                          const optionStateClass = getOptionStateClass(
                            session.isValidated,
                            selectedIndex,
                            meaningIndex,
                            item.correctMeaningIndex,
                          );

                          return (
                            <button
                              key={`${item.pvId}-${meaningIndex}`}
                              type='button'
                              onClick={() =>
                                handleSelectAnswer(item.pvId, meaningIndex)
                              }
                              disabled={
                                session.isValidated || isGeneratingExercise
                              }
                              className={cn(
                                'w-full rounded-[6px] border-2 px-3 py-2 text-left text-sm sm:text-base font-semibold transition-colors',
                                optionStateClass,
                              )}
                            >
                              {meaning}
                            </button>
                          );
                        },
                      )}
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
                              Correct answer:{' '}
                              {item.meanings[item.correctMeaningIndex]}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : isMarkSentencesCorrectExercise(currentExercise) ? (
            <ul className='space-y-4'>
              {currentExercise.items.map((item, itemIndex) => {
                const selectedIndex = session.answersByPvId[item.pvId] as
                  | number
                  | undefined;
                const isCorrect = selectedIndex === item.correctSentenceIndex;
                const sentenceOptions = [
                  item.firstSentenceMarkdown,
                  item.secondSentenceMarkdown,
                ];

                return (
                  <li
                    key={`${item.pvId}-${itemIndex}`}
                    className='rounded-xl border-2 border-border bg-[#f3ede0] p-4'
                  >
                    <p className='mb-1 text-xs font-black uppercase text-muted-foreground'>
                      Group {itemIndex + 1}
                    </p>

                    <div className='space-y-2'>
                      {sentenceOptions.map(
                        (sentenceMarkdown, sentenceIndex) => {
                          const optionStateClass = getOptionStateClass(
                            session.isValidated,
                            selectedIndex,
                            sentenceIndex,
                            item.correctSentenceIndex,
                          );

                          return (
                            <button
                              key={`${item.pvId}-sentence-${sentenceIndex}`}
                              type='button'
                              onClick={() =>
                                handleSelectAnswer(item.pvId, sentenceIndex)
                              }
                              disabled={
                                session.isValidated || isGeneratingExercise
                              }
                              className={cn(
                                'w-full rounded-[6px] border-2 px-3 py-2 text-left text-sm sm:text-base italic font-medium transition-colors',
                                optionStateClass,
                              )}
                            >
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p>{children}</p>,
                                  strong: ({ children }) => (
                                    <strong className='rounded-lg bg-primary/15 px-1 text-primary'>
                                      {children}
                                    </strong>
                                  ),
                                }}
                              >
                                {sentenceMarkdown}
                              </ReactMarkdown>
                            </button>
                          );
                        },
                      )}
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
                              Correct answer:{' '}
                              {item.correctSentenceIndex === 0
                                ? markdownToPlainText(
                                    item.firstSentenceMarkdown,
                                  )
                                : markdownToPlainText(
                                    item.secondSentenceMarkdown,
                                  )}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <DndContext onDragEnd={handleFillDragEnd}>
              <div className='mt-4 rounded-xl border-2 border-border bg-muted p-3'>
                <p className='mb-2 text-xs font-black uppercase text-muted-foreground'>
                  Words panel
                </p>
                <p className='mb-3 text-sm font-medium text-muted-foreground'>
                  Tap a word, then tap an empty gap to place it.
                </p>
                <DroppableWordSlot
                  id='word-bank'
                  className='flex flex-wrap gap-2'
                >
                  {availableFillWords.length === 0 ? (
                    <p className='text-sm font-medium text-muted-foreground'>
                      All words are placed.
                    </p>
                  ) : (
                    availableFillWords.map((token) => (
                      <DraggableWordToken
                        key={token.id}
                        id={`word:${token.id}`}
                        text={token.text}
                        disabled={session.isValidated}
                        isSelected={selectedWordForTap === token.text}
                        onTap={() => handleWordChipTap(token.text)}
                      />
                    ))
                  )}
                </DroppableWordSlot>
              </div>
              <div className='h-2.5'></div>
              <ul className='space-y-4'>
                {currentExercise.items.map((item, itemIndex) => {
                  const assignedWord = assignedWordsByPvId[item.pvId] ?? null;
                  const isCorrect =
                    session.isValidated &&
                    assignedWord !== null &&
                    normalizeWord(assignedWord) ===
                      normalizeWord(item.correctWord);

                  const blankStateClass = getOptionStateClass(
                    session.isValidated,
                    assignedWord ? 1 : undefined,
                    assignedWord ? 1 : 0,
                    isCorrect ? 1 : 0,
                  );

                  return (
                    <li
                      key={`${item.pvId}-${itemIndex}`}
                      className='rounded-xl border-2 border-border bg-[#f3ede0] p-4'
                    >
                      <p className='mb-1 text-xs font-black uppercase text-muted-foreground'>
                        Sentence {itemIndex + 1}
                      </p>

                      <div
                        role='button'
                        tabIndex={session.isValidated ? -1 : 0}
                        aria-disabled={session.isValidated}
                        onClick={() => {
                          if (!session.isValidated) {
                            handleBlankTap(item.pvId);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (session.isValidated) {
                            return;
                          }

                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleBlankTap(item.pvId);
                          }
                        }}
                        className='w-full text-left'
                      >
                        <DroppableWordSlot
                          id={`blank:${item.pvId}`}
                          className={cn(
                            'mb-2 rounded-[6px] border-2 px-3 py-2',
                            blankStateClass,
                          )}
                        >
                          <span>{item.sentencePrefix} </span>
                          {assignedWord ? (
                            <DraggableWordToken
                              id={`word:${assignedWord}`}
                              text={assignedWord}
                              disabled={session.isValidated}
                              isSelected={selectedWordForTap === assignedWord}
                              onTap={() => handleWordChipTap(assignedWord)}
                            />
                          ) : (
                            <span className='mx-1 inline-block min-w-24 border-b-2 border-dashed border-primary align-middle' />
                          )}
                          <span> {item.sentenceSuffix}</span>
                        </DroppableWordSlot>
                      </div>

                      {session.isValidated && !isCorrect && (
                        <p className='text-sm font-medium text-foreground'>
                          Correct answer: {item.correctWord}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </DndContext>
          )}

          {uiError && (
            <div className='mb-4 rounded-xl border-2 border-border bg-destructive/10 p-3 my-4'>
              <p className='font-bold text-destructive'>{uiError}</p>
            </div>
          )}

          <div className='flex flex-wrap items-center justify-between gap-3 mt-4'>
            <div className='text-sm font-semibold text-muted-foreground'>
              Score: {session.totalCorrect}/{session.totalQuestions} (
              {totalAccuracy}%)
            </div>

            {!session.isValidated ? (
              <Button onClick={handleValidate} disabled={isGeneratingExercise}>
                Validate my answers
              </Button>
            ) : (
              <Button
                onClick={() => void handleContinue()}
                disabled={isGeneratingExercise}
              >
                {isGeneratingExercise ? (
                  <span className='inline-flex items-center gap-2'>
                    <Spinner className='h-4 w-4' />
                    Generating exercise
                  </span>
                ) : session.currentExerciseIndex >=
                  session.exerciseOrder.length - 1 ? (
                  'Finish session'
                ) : (
                  "Let's continue!"
                )}
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
