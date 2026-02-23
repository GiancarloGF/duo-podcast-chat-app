'use client';

import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { ExerciseResult, LocalSrsMetaRow } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import { Button } from '@/shared/presentation/components/ui/button';

interface SessionSummaryProps {
  results: ExerciseResult[];
  phrasalVerbs: PhrasalVerb[];
  srsMeta: LocalSrsMetaRow | null;
  pendingCount: number;
  onStartNewSession: () => Promise<void> | void;
  onViewProgress: () => void;
}

export function SessionSummary({
  results,
  phrasalVerbs,
  srsMeta,
  pendingCount,
  onStartNewSession,
  onViewProgress,
}: SessionSummaryProps) {
  const correctCount = results.filter((result) => result.isCorrect).length;
  const total = results.length;
  const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

  const byId = new Map(phrasalVerbs.map((pv) => [pv.id, pv]));
  const incorrectRows = results
    .filter((result) => !result.isCorrect)
    .map((result) => ({
      result,
      pv: byId.get(result.pvId),
    }));

  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-4 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-4'>
        <p className='text-xs font-black uppercase text-muted-foreground'>Phase 3: Summary</p>
        <h2 className='text-2xl font-black text-foreground sm:text-3xl'>Session completed</h2>
        <p className='text-sm font-medium text-muted-foreground'>
          Review your results and continue with a new session.
        </p>
      </div>

      <div className='mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <article className='rounded-xl border-2 border-border bg-muted p-3'>
          <p className='text-xs font-black uppercase text-muted-foreground'>Accuracy</p>
          <p className='text-3xl font-black text-foreground'>{accuracy}%</p>
        </article>
        <article className='rounded-xl border-2 border-border bg-emerald-100 p-3'>
          <p className='text-xs font-black uppercase text-emerald-900'>Correct answers</p>
          <p className='text-3xl font-black text-emerald-900'>
            {correctCount}/{total}
          </p>
        </article>
        <article className='rounded-xl border-2 border-border bg-secondary p-3'>
          <p className='text-xs font-black uppercase text-secondary-foreground'>Current streak</p>
          <p className='text-3xl font-black text-secondary-foreground'>
            {srsMeta?.currentStreak ?? 0}
          </p>
        </article>
      </div>

      <div className='mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <article className='rounded-xl border-2 border-border bg-muted p-3'>
          <p className='text-xs font-black uppercase text-muted-foreground'>Viewed</p>
          <p className='text-2xl font-black text-foreground'>{srsMeta?.totalViewed ?? 0}</p>
        </article>
        <article className='rounded-xl border-2 border-border bg-muted p-3'>
          <p className='text-xs font-black uppercase text-muted-foreground'>Mastered</p>
          <p className='text-2xl font-black text-foreground'>{srsMeta?.totalMastered ?? 0}</p>
        </article>
      </div>

      <div className='rounded-xl border-2 border-border bg-muted p-3'>
        <h3 className='text-lg font-black text-foreground'>For review</h3>

        {incorrectRows.length === 0 ? (
          <p className='mt-2 text-sm font-medium text-emerald-800'>
            You got all the answers correct! Great job! 🎉
          </p>
        ) : (
          <ul className='mt-3 space-y-2'>
            {incorrectRows.map(({ result, pv }) => (
              <li key={`${result.pvId}-${result.answeredAt}`} className='rounded-[6px] border-2 border-border bg-card p-2'>
                <p className='font-black text-foreground'>{pv?.phrasalVerb ?? result.pvId}</p>
                <p className='text-sm font-medium text-muted-foreground'>
                  Correct answer: {result.correctAnswer}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingCount > 0 ? (
        <p className='mt-4 rounded-[6px] border-2 border-amber-700 bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900'>
          There are {pendingCount} pending session(s) that need to be synchronized.
        </p>
      ) : null}

      <div className='mt-5 flex flex-wrap gap-3'>
        <Button onClick={() => void onStartNewSession()}>New session</Button>
        <Button variant='outline' onClick={onViewProgress}>
          View progress
        </Button>
      </div>
    </section>
  );
}
