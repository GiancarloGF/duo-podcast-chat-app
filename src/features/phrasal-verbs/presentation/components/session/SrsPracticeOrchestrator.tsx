'use client';

import { useRouter } from 'next/navigation';
import { PracticePhase } from '@/features/phrasal-verbs/presentation/components/session/PracticePhase';
import { SessionErrorBoundary } from '@/features/phrasal-verbs/presentation/components/session/SessionErrorBoundary';
import { SessionSummary } from '@/features/phrasal-verbs/presentation/components/session/SessionSummary';
import { TheoryPhase } from '@/features/phrasal-verbs/presentation/components/session/TheoryPhase';
import { useSessionFlow } from '@/features/phrasal-verbs/presentation/hooks/useSessionFlow';
import { Button } from '@/shared/presentation/components/ui/button';
import { Spinner } from '@/shared/presentation/components/ui/spinner';

export function SrsPracticeOrchestrator() {
  const router = useRouter();
  const {
    phase,
    isLoading,
    isSaving,
    error,
    catalogHydration,
    session,
    practiceQueue,
    results,
    srsMeta,
    pendingCount,
    completeTheory,
    buildExerciseResults,
    finishPractice,
    startNewSession,
    retryBootstrap,
  } = useSessionFlow();

  if (isLoading || phase === 'loading') {
    return (
      <section className='rounded-[10px] border-2 border-border bg-card p-8 shadow-[8px_8px_0_0_var(--color-border)]'>
        <div className='flex items-center gap-2'>
          <Spinner className='h-5 w-5' />
          <p className='font-semibold text-foreground'>
            {catalogHydration.phase === 'ready'
              ? 'Preparando sesión SRS...'
              : catalogHydration.message}
          </p>
        </div>
      </section>
    );
  }

  if (error || phase === 'error') {
    return (
      <section className='rounded-[10px] border-2 border-red-700 bg-red-100 p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <h2 className='text-xl font-black text-red-900'>Failed to start session</h2>
        <p className='mt-2 text-sm font-medium text-red-900'>{error ?? 'Unknown error.'}</p>
        <div className='mt-4 flex flex-wrap gap-2'>
          <Button variant='outline' onClick={() => void retryBootstrap()}>
            Retry
          </Button>
          <Button variant='outline' onClick={() => router.push('/phrasal-verbs')}>
            Go back
          </Button>
        </div>
      </section>
    );
  }

  if (!session) {
    return (
      <section className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <p className='font-semibold text-foreground'>There is no active session.</p>
      </section>
    );
  }

  if (phase === 'practice' && practiceQueue.length === 0) {
    return (
      <section className='rounded-[10px] border-2 border-red-700 bg-red-100 p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <p className='font-black text-red-900'>Failed to prepare practice.</p>
        <Button variant='outline' className='mt-3' onClick={() => void retryBootstrap()}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <SessionErrorBoundary>
      {phase === 'theory' ? (
        <TheoryPhase phrasalVerbs={session.sessionPVs} onComplete={completeTheory} />
      ) : null}

      {phase === 'practice' ? (
        <PracticePhase
          exercises={practiceQueue}
          isSaving={isSaving}
          onBuildResults={buildExerciseResults}
          onComplete={finishPractice}
        />
      ) : null}

      {phase === 'summary' ? (
        <SessionSummary
          results={results}
          phrasalVerbs={session.sessionPVs}
          srsMeta={srsMeta}
          pendingCount={pendingCount}
          onStartNewSession={startNewSession}
          onViewProgress={() => router.push('/phrasal-verbs/progress')}
        />
      ) : null}
    </SessionErrorBoundary>
  );
}
