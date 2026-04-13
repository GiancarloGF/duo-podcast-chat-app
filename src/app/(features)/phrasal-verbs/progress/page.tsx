import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity,
  Award,
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flame,
  Target,
  Trophy,
} from 'lucide-react';
import { getSrsProgressSnapshotForCurrentUser } from '@/features/phrasal-verbs/server/getSrsProgressSnapshotForCurrentUser';
import { ProgressDashboardSkeleton } from '@/features/phrasal-verbs/presentation/components/ProgressDashboardSkeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/presentation/components/ui/breadcrumb';
import { Button } from '@/shared/presentation/components/ui/button';
import { createFeatureMetadata } from '@/shared/presentation/metadata/featureMetadata';

export const metadata: Metadata = createFeatureMetadata({
  title: 'Progress',
  description: 'Revisa tu progreso global, rachas y sesiones acumuladas de phrasal verbs.',
  path: '/phrasal-verbs/progress',
});

export default async function PhrasalVerbsProgressPage() {
  return (
    <div className='py-4'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/'>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/phrasal-verbs'>Phrasal verbs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Progress</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className='mb-6 rounded-[10px] border-2 border-border bg-card p-4 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <h1 className='mb-2 text-xl sm:text-4xl font-black text-foreground'>
          Global progress
        </h1>
        <p className='text-sm sm:text-lg font-medium text-muted-foreground'>
          Global statistics about your progress in learning phrasal verbs. Keep practicing to see improvements here!
        </p>
      </section>

      <Suspense fallback={<ProgressDashboardSkeleton />}>
        <ProgressDashboardSection />
      </Suspense>
    </div>
  );
}

async function ProgressDashboardSection() {
  const snapshotResult = await getSrsProgressSnapshotForCurrentUser();
  const nowMs = snapshotResult.snapshot?.meta.lastSyncAt ?? 0;
  const analytics = snapshotResult.snapshot?.meta.analytics;

  // The page derives dashboard-friendly counters from the compact SRS map to
  // avoid storing redundant aggregates in Firestore.
  const dueReviews = snapshotResult.snapshot
    ? Object.values(snapshotResult.snapshot.progress).filter(
        (entry) => entry.nr !== null && entry.nr <= nowMs,
      ).length
    : 0;

  const learningCount = snapshotResult.snapshot
    ? Object.values(snapshotResult.snapshot.progress).filter(
        (entry) => entry.s === 'learning',
      ).length
    : 0;

  const reviewCount = snapshotResult.snapshot
    ? Object.values(snapshotResult.snapshot.progress).filter(
        (entry) => entry.s === 'review',
      ).length
    : 0;

  return (
    <>
      {!snapshotResult.success || !snapshotResult.snapshot ? (
        <section className='rounded-[10px] border-2 border-red-700 bg-red-100 p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
          <p className='font-black text-red-900'>It was not possible to load your progress.</p>
          <p className='mt-2 text-sm font-medium text-red-900'>
            {snapshotResult.error ?? snapshotResult.details ?? 'Unknown error.'}
          </p>
          <Button asChild className='mt-4'>
            <Link href='/phrasal-verbs/practice'>Go to practice</Link>
          </Button>
        </section>
      ) : (
        <>
          <section className='mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-orange-100 to-amber-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-2 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Current streak</p>
                <Flame className='h-5 w-5 text-orange-600' />
              </div>
              <p className='text-3xl font-black text-foreground'>
                {snapshotResult.snapshot.meta.currentStreak}
              </p>
            </article>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-yellow-100 to-amber-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-2 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Record</p>
                <Trophy className='h-5 w-5 text-yellow-700' />
              </div>
              <p className='text-3xl font-black text-foreground'>
                {snapshotResult.snapshot.meta.longestStreak}
              </p>
            </article>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-sky-100 to-cyan-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-2 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Viewed</p>
                <BookOpen className='h-5 w-5 text-sky-700' />
              </div>
              <p className='text-3xl font-black text-foreground'>
                {snapshotResult.snapshot.meta.totalViewed}
              </p>
            </article>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-emerald-100 to-lime-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-2 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Mastered</p>
                <Award className='h-5 w-5 text-emerald-700' />
              </div>
              <p className='text-3xl font-black text-foreground'>
                {snapshotResult.snapshot.meta.totalMastered}
              </p>
            </article>
          </section>

          <section className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-violet-100 to-fuchsia-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-secondary-foreground'>Due reviews</p>
                <CalendarClock className='h-5 w-5 text-violet-700' />
              </div>
              <p className='text-2xl font-black text-secondary-foreground'>{dueReviews}</p>
            </article>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-blue-100 to-indigo-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Learning</p>
                <Activity className='h-5 w-5 text-blue-700' />
              </div>
              <p className='text-2xl font-black text-foreground'>{learningCount}</p>
            </article>
            <article className='rounded-xl border-2 border-border bg-linear-to-br from-teal-100 to-cyan-50 p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Reviewing</p>
                <CheckCircle2 className='h-5 w-5 text-teal-700' />
              </div>
              <p className='text-2xl font-black text-foreground'>{reviewCount}</p>
            </article>
          </section>

          <section className='mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <article className='rounded-xl border-2 border-border bg-card p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Total sessions</p>
                <Target className='h-5 w-5 text-primary' />
              </div>
              <p className='text-2xl font-black text-foreground'>{analytics?.totalSessions ?? 0}</p>
            </article>
            <article className='rounded-xl border-2 border-border bg-card p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Total exercises</p>
                <BookOpen className='h-5 w-5 text-primary' />
              </div>
              <p className='text-2xl font-black text-foreground'>{analytics?.totalExercises ?? 0}</p>
            </article>
            <article className='rounded-xl border-2 border-border bg-card p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Global accuracy</p>
                <BarChart3 className='h-5 w-5 text-primary' />
              </div>
              <p className='text-2xl font-black text-foreground'>{analytics?.averageAccuracy ?? 0}%</p>
            </article>
            <article className='rounded-xl border-2 border-border bg-card p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
              <div className='mb-1 flex items-center justify-between'>
                <p className='text-xs font-black uppercase text-muted-foreground'>Time accumulated</p>
                <Clock3 className='h-5 w-5 text-primary' />
              </div>
              <p className='text-2xl font-black text-foreground'>
                {Math.floor((analytics?.totalTimeSeconds ?? 0) / 60)} min
              </p>
            </article>
          </section>

          <div className='mt-6'>
            <Button asChild className='text-base font-black'>
              <Link href='/phrasal-verbs/practice'>
               Let&apos;s practice!
              </Link>
            </Button>
          </div>
        </>
      )}
    </>
  );
}
