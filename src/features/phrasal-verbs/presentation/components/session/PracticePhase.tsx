'use client';

import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { ExerciseResult } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import type {
  FillInGapsDragDropBlock,
  MarkSentencesCorrectBlock,
  PracticeExerciseBlock,
  ReadAndMarkMeaningBlock,
} from '@/features/phrasal-verbs/presentation/session.types';
import { Button } from '@/shared/presentation/components/ui/button';
import { cn } from '@/shared/presentation/utils';

interface PracticePhaseProps {
  exercises: PracticeExerciseBlock[];
  totalExercises: number;
  isGeneratingNextExercise: boolean;
  isSaving: boolean;
  onBuildResults: (
    exercise: PracticeExerciseBlock,
    answersByPvId: Record<string, string | number | undefined>,
  ) => ExerciseResult[];
  onContinueToNextExercise: (
    nextResults: ExerciseResult[],
    nextIndex: number,
  ) => Promise<void> | void;
  onComplete: (results: ExerciseResult[]) => Promise<void> | void;
}

interface DraggableWordChipProps {
  id: string;
  text: string;
  disabled: boolean;
  isSelected: boolean;
  onTap: () => void;
}

interface DroppableSlotProps {
  id: string;
  className?: string;
  children: ReactNode;
}

interface ShuffledOption {
  originalIndex: number;
  label: string;
}

const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p {...props} className='text-base sm:text-[20px] leading-relaxed italic'>
      {children}
    </p>
  ),
  strong: ({ children, ...props }) => (
    <strong {...props} className='font-black text-violet-700'>
      {children}
    </strong>
  ),
};

function normalizeWord(value: string): string {
  return value.trim().toLowerCase();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleOptionsDeterministic(
  options: ShuffledOption[],
  seedKey: string,
): ShuffledOption[] {
  const random = seededRandom(hashString(seedKey));
  const shuffled = [...options];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function getExerciseLabel(exercise: PracticeExerciseBlock): string {
  if (exercise.exerciseType === 'read_and_mark_meaning') {
    return 'Match the correct meaning';
  }

  if (exercise.exerciseType === 'mark_sentences_correct') {
    return 'Select the correct sentence';
  }

  return 'Fill in the gap';
}

function DraggableWordChip({
  id,
  text,
  disabled,
  isSelected,
  onTap,
}: DraggableWordChipProps) {
  const touchTapHandledRef = useRef(false);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled,
  });

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
        'touch-manipulation select-none inline-flex rounded-[6px] border-2 border-border bg-card px-3 py-1.5 text-base sm:text-lg font-black text-foreground',
        isSelected && 'border-primary bg-primary/10 text-primary',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {text}
    </button>
  );
}

function DroppableSlot({ id, className, children }: DroppableSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

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

function isReadAndMarkMeaningBlock(
  exercise: PracticeExerciseBlock,
): exercise is ReadAndMarkMeaningBlock {
  return exercise.exerciseType === 'read_and_mark_meaning';
}

function isMarkSentencesCorrectBlock(
  exercise: PracticeExerciseBlock,
): exercise is MarkSentencesCorrectBlock {
  return exercise.exerciseType === 'mark_sentences_correct';
}

function isFillInGapsDragDropBlock(
  exercise: PracticeExerciseBlock,
): exercise is FillInGapsDragDropBlock {
  return exercise.exerciseType === 'fill_in_gaps_drag_drop';
}

export function PracticePhase({
  exercises,
  totalExercises,
  isGeneratingNextExercise,
  isSaving,
  onBuildResults,
  onContinueToNextExercise,
  onComplete,
}: PracticePhaseProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [answersByPvId, setAnswersByPvId] = useState<
    Record<string, string | number | undefined>
  >({});
  const [isValidated, setIsValidated] = useState(false);
  const [validatedResults, setValidatedResults] = useState<ExerciseResult[]>(
    [],
  );
  const [allResults, setAllResults] = useState<ExerciseResult[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [selectedWordForTap, setSelectedWordForTap] = useState<string | null>(
    null,
  );

  const currentExercise = exercises[currentExerciseIndex] ?? null;
  const isLastExercise = currentExerciseIndex >= totalExercises - 1;

  const progressPercent = useMemo(() => {
    if (totalExercises === 0) {
      return 0;
    }

    return ((currentExerciseIndex + 1) / totalExercises) * 100;
  }, [currentExerciseIndex, totalExercises]);

  const fillExercise =
    currentExercise && isFillInGapsDragDropBlock(currentExercise)
      ? currentExercise
      : null;

  const shuffledMeaningOptionsByPvId = useMemo(() => {
    if (!currentExercise || !isReadAndMarkMeaningBlock(currentExercise)) {
      return {} as Record<string, ShuffledOption[]>;
    }

    return Object.fromEntries(
      currentExercise.items.map((item) => {
        const options = item.meanings.map((meaning, originalIndex) => ({
          originalIndex,
          label: meaning,
        }));
        const shuffled = shuffleOptionsDeterministic(
          options,
          `meaning:${currentExerciseIndex}:${item.pvId}`,
        );
        return [item.pvId, shuffled];
      }),
    ) as Record<string, ShuffledOption[]>;
  }, [currentExercise, currentExerciseIndex]);

  const shuffledSentenceOptionsByPvId = useMemo(() => {
    if (!currentExercise || !isMarkSentencesCorrectBlock(currentExercise)) {
      return {} as Record<string, ShuffledOption[]>;
    }

    return Object.fromEntries(
      currentExercise.items.map((item) => {
        const options: ShuffledOption[] = [
          { originalIndex: 0, label: item.firstSentenceMarkdown },
          { originalIndex: 1, label: item.secondSentenceMarkdown },
        ];
        const shuffled = shuffleOptionsDeterministic(
          options,
          `sentence:${currentExerciseIndex}:${item.pvId}`,
        );
        return [item.pvId, shuffled];
      }),
    ) as Record<string, ShuffledOption[]>;
  }, [currentExercise, currentExerciseIndex]);

  const assignedWordsByPvId = useMemo(() => {
    if (!fillExercise) {
      return {} as Record<string, string>;
    }

    return Object.fromEntries(
      Object.entries(answersByPvId).filter(
        ([, value]) => typeof value === 'string',
      ),
    ) as Record<string, string>;
  }, [answersByPvId, fillExercise]);

  const availableWords = useMemo(() => {
    if (!fillExercise) {
      return [] as string[];
    }

    const assigned = new Set(
      Object.values(assignedWordsByPvId).map(normalizeWord),
    );

    return fillExercise.wordBank.filter(
      (word) => !assigned.has(normalizeWord(word)),
    );
  }, [assignedWordsByPvId, fillExercise]);

  function handleSelectAnswer(
    pvId: string,
    value: string | number | undefined,
  ): void {
    if (isValidated) {
      return;
    }

    setAnswersByPvId((previous) => ({
      ...previous,
      [pvId]: value,
    }));
  }

  function assignWordToBlank(word: string, targetPvId: string): void {
    if (!fillExercise || isValidated) {
      return;
    }

    setAnswersByPvId((previous) => {
      const next = { ...previous };

      Object.entries(next).forEach(([pvId, value]) => {
        if (
          typeof value === 'string' &&
          normalizeWord(value) === normalizeWord(word)
        ) {
          delete next[pvId];
        }
      });

      next[targetPvId] = word;
      return next;
    });
  }

  function removeAssignedWord(word: string): void {
    if (isValidated) {
      return;
    }

    setAnswersByPvId((previous) => {
      const next = { ...previous };

      Object.entries(next).forEach(([pvId, value]) => {
        if (
          typeof value === 'string' &&
          normalizeWord(value) === normalizeWord(word)
        ) {
          delete next[pvId];
        }
      });

      return next;
    });
  }

  function handleFillDragEnd(event: DragEndEvent): void {
    if (!fillExercise || isValidated) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!activeId.startsWith('word:') || !overId) {
      return;
    }

    const word = activeId.replace('word:', '');

    if (overId === 'word-bank') {
      removeAssignedWord(word);
      return;
    }

    if (overId.startsWith('blank:')) {
      const pvId = overId.replace('blank:', '');
      assignWordToBlank(word, pvId);
    }
  }

  function validateCurrentExercise(): void {
    if (!currentExercise) {
      return;
    }

    const hasUnanswered = currentExercise.items.some(
      (item) =>
        answersByPvId[item.pvId] === undefined ||
        answersByPvId[item.pvId] === '',
    );

    if (hasUnanswered) {
      setLocalError('You should answer all the questions before validating.');
      return;
    }

    const results = onBuildResults(currentExercise, answersByPvId);
    setValidatedResults(results);
    setIsValidated(true);
    setLocalError(null);
    setSelectedWordForTap(null);
  }

  async function continueToNextExercise(): Promise<void> {
    const nextResults = [...allResults, ...validatedResults];

    if (isLastExercise) {
      setAllResults(nextResults);
      await onComplete(nextResults);
      return;
    }

    const nextIndex = currentExerciseIndex + 1;

    try {
      await onContinueToNextExercise(nextResults, nextIndex);
      setAllResults(nextResults);
      setCurrentExerciseIndex(nextIndex);
      setAnswersByPvId({});
      setValidatedResults([]);
      setIsValidated(false);
      setLocalError(null);
      setSelectedWordForTap(null);
    } catch (error) {
      setLocalError(
        error instanceof Error && error.message
          ? error.message
          : 'Failed to generate the next exercise.',
      );
    }
  }

  function getResultByPvId(pvId: string): ExerciseResult | null {
    return validatedResults.find((result) => result.pvId === pvId) ?? null;
  }

  if (!currentExercise) {
    return null;
  }

  const correctSoFar = allResults.filter((result) => result.isCorrect).length;

  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-4 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-4'>
        <div className='mb-1 flex items-center justify-between text-sm sm:text-base font-black uppercase text-muted-foreground'>
          <span>Phase 2: Practice</span>
          <span>
            Exercise {currentExerciseIndex + 1} / {totalExercises}
          </span>
        </div>
        <div className='h-3 overflow-hidden rounded-[6px] border-2 border-border bg-muted'>
          <div
            className='h-full bg-primary transition-all duration-300'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className='mb-4 rounded-xl border-2 border-border bg-muted p-3'>
        <p className='text-sm sm:text-base font-black uppercase text-muted-foreground'>
          {getExerciseLabel(currentExercise)}
        </p>
        <h2 className='text-2xl sm:text-3xl font-black text-foreground'>
          {currentExercise.title}
        </h2>
        <p className='text-base sm:text-lg font-medium text-muted-foreground'>
          {currentExercise.instructions}
        </p>
      </div>

      {isReadAndMarkMeaningBlock(currentExercise) ? (
        <ul className='space-y-3'>
          {currentExercise.items.map((item, index) => {
            const selectedAnswer = answersByPvId[item.pvId] as
              | number
              | undefined;
            const result = getResultByPvId(item.pvId);

            return (
              <li
                key={`${item.pvId}-${index}`}
                className='rounded-xl border-2 border-border bg-[#f3ede0] p-3'
              >
                <p className='mb-1 text-sm sm:text-base font-black uppercase text-muted-foreground'>
                  Block {index + 1}
                </p>
                <div className='mb-2 text-base sm:text-lg font-medium text-foreground'>
                  <ReactMarkdown components={markdownComponents}>
                    {item.sentenceMarkdown}
                  </ReactMarkdown>
                </div>

                <div className='space-y-2'>
                  {(shuffledMeaningOptionsByPvId[item.pvId] ?? []).map(
                    (option) => (
                      <button
                        key={`${item.pvId}-${option.originalIndex}`}
                        type='button'
                        onClick={() =>
                          handleSelectAnswer(item.pvId, option.originalIndex)
                        }
                        disabled={isValidated}
                        className={cn(
                          'w-full rounded-[6px] border-2 px-3 py-2 text-left text-base sm:text-lg font-semibold',
                          selectedAnswer === option.originalIndex
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-card text-foreground',
                          isValidated &&
                            option.originalIndex === item.correctMeaningIndex &&
                            'border-emerald-700 bg-emerald-100 text-emerald-900',
                          isValidated &&
                            selectedAnswer === option.originalIndex &&
                            option.originalIndex !== item.correctMeaningIndex &&
                            'border-red-700 bg-red-100 text-red-900',
                        )}
                      >
                        {option.label}
                      </button>
                    ),
                  )}
                </div>

                {isValidated && result ? (
                  <p
                    className={cn(
                      'mt-2 text-base sm:text-lg font-black',
                      result.isCorrect ? 'text-emerald-800' : 'text-red-800',
                    )}
                  >
                    {result.isCorrect
                      ? 'Correcto'
                      : `Incorrecto. Respuesta correcta: ${result.correctAnswer}`}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {isMarkSentencesCorrectBlock(currentExercise) ? (
        <ul className='space-y-3'>
          {currentExercise.items.map((item, index) => {
            const selectedAnswer = answersByPvId[item.pvId] as
              | number
              | undefined;
            const result = getResultByPvId(item.pvId);

            return (
              <li
                key={`${item.pvId}-${index}`}
                className='rounded-xl border-2 border-border bg-[#f3ede0] p-3'
              >
                <p className='mb-1 text-sm sm:text-base font-black uppercase text-muted-foreground'>
                  Block {index + 1}
                </p>

                {(shuffledSentenceOptionsByPvId[item.pvId] ?? []).map(
                  (option) => (
                    <button
                      key={`${item.pvId}-sentence-${option.originalIndex}`}
                      type='button'
                      onClick={() =>
                        handleSelectAnswer(item.pvId, option.originalIndex)
                      }
                      disabled={isValidated}
                      className={cn(
                        'mb-2 w-full rounded-[6px] border-2 px-3 py-2 text-left text-base sm:text-lg font-semibold',
                        selectedAnswer === option.originalIndex
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-foreground',
                        isValidated &&
                          option.originalIndex === item.correctSentenceIndex &&
                          'border-emerald-700 bg-emerald-100 text-emerald-900',
                        isValidated &&
                          selectedAnswer === option.originalIndex &&
                          option.originalIndex !== item.correctSentenceIndex &&
                          'border-red-700 bg-red-100 text-red-900',
                      )}
                    >
                      <ReactMarkdown components={markdownComponents}>
                        {option.label}
                      </ReactMarkdown>
                    </button>
                  ),
                )}

                {isValidated && result ? (
                  <p
                    className={cn(
                      'mt-1 text-base sm:text-lg font-black',
                      result.isCorrect ? 'text-emerald-800' : 'text-red-800',
                    )}
                  >
                    {result.isCorrect
                      ? 'Correcto'
                      : `Incorrecto. Respuesta correcta: ${result.correctAnswer}`}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {isFillInGapsDragDropBlock(currentExercise) ? (
        <DndContext onDragEnd={handleFillDragEnd}>
          <div className='mb-3 rounded-xl border-2 border-border bg-muted p-3'>
            <p className='mb-2 text-sm sm:text-base font-black uppercase text-muted-foreground'>
              Word Bank
            </p>
            <DroppableSlot
              id='word-bank'
              className='flex min-h-12 flex-wrap gap-2'
            >
              {availableWords.length === 0 ? (
                <p className='text-base sm:text-lg font-medium text-muted-foreground'>
                  All words have been assigned.
                </p>
              ) : (
                availableWords.map((word) => (
                  <DraggableWordChip
                    key={word}
                    id={`word:${word}`}
                    text={word}
                    disabled={isValidated}
                    isSelected={selectedWordForTap === word}
                    onTap={() => {
                      if (selectedWordForTap === word) {
                        setSelectedWordForTap(null);
                        return;
                      }

                      setSelectedWordForTap(word);
                    }}
                  />
                ))
              )}
            </DroppableSlot>
          </div>

          <ul className='space-y-3'>
            {currentExercise.items.map((item, index) => {
              const assignedWord =
                typeof answersByPvId[item.pvId] === 'string'
                  ? (answersByPvId[item.pvId] as string)
                  : null;
              const result = getResultByPvId(item.pvId);

              return (
                <li
                  key={`${item.pvId}-${index}`}
                  className={cn(
                    'rounded-xl border-2 border-border bg-[#f3ede0] p-3',
                    isValidated && result?.isCorrect && 'border-emerald-700 bg-emerald-100',
                    isValidated && result && !result.isCorrect && 'border-red-700 bg-red-100',
                  )}
                >
                  <p className='mb-1 text-sm sm:text-base font-black uppercase text-muted-foreground'>
                    Block {index + 1}
                  </p>

                  <DroppableSlot
                    id={`blank:${item.pvId}`}
                    className='rounded-[6px] border-2 border-border bg-card px-3 py-2'
                  >
                    <button
                      type='button'
                      onClick={() => {
                        if (isValidated) {
                          return;
                        }

                        if (!selectedWordForTap) {
                          if (assignedWord) {
                            removeAssignedWord(assignedWord);
                          }
                          return;
                        }

                        assignWordToBlank(selectedWordForTap, item.pvId);
                        setSelectedWordForTap(null);
                      }}
                      disabled={isValidated}
                      className='w-full text-left text-base sm:text-lg font-medium text-foreground'
                    >
                      {item.sentencePrefix}{' '}
                      {assignedWord ? (
                        <span className='inline-flex rounded-[6px] border-2 border-border bg-primary/10 px-2 py-0.5 font-black text-primary'>
                          {assignedWord}
                        </span>
                      ) : (
                        <span className='inline-block min-w-24 border-b-2 border-dashed border-primary align-middle' />
                      )}{' '}
                      {item.sentenceSuffix}
                    </button>
                  </DroppableSlot>

                  {isValidated && result ? (
                    <p
                      className={cn(
                        'mt-2 text-base sm:text-lg font-black',
                        result.isCorrect ? 'text-emerald-800' : 'text-red-800',
                      )}
                    >
                      {result.isCorrect
                        ? 'Correcto'
                        : `Incorrecto. Respuesta correcta: ${item.correctWord}`}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </DndContext>
      ) : null}

      {localError ? (
        <p className='mt-3 rounded-[6px] border-2 border-red-700 bg-red-100 px-3 py-2 text-base sm:text-lg font-semibold text-red-800'>
          {localError}
        </p>
      ) : null}

      {isGeneratingNextExercise ? (
        <div className='mt-3 rounded-[6px] border-2 border-border bg-muted px-3 py-2 text-base sm:text-lg font-semibold text-foreground'>
          Generating the next exercise...
        </div>
      ) : null}

      <div className='mt-4 flex items-center justify-between gap-3'>
        <p className='text-base sm:text-lg font-semibold text-muted-foreground'>
          Corrects: {correctSoFar}/{allResults.length}
        </p>

        {!isValidated ? (
          <Button onClick={validateCurrentExercise}>Validate exercise</Button>
        ) : (
          <Button
            onClick={() => void continueToNextExercise()}
            disabled={isSaving || isGeneratingNextExercise}
          >
            {isLastExercise
              ? isSaving
                ? 'Saving...'
                : 'Finalize session'
              : isGeneratingNextExercise
                ? 'Generating...'
                : 'Next exercise'}
          </Button>
        )}
      </div>
    </section>
  );
}
