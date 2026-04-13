import { Skeleton } from '@/shared/presentation/components/ui/skeleton';

function MetricCardSkeleton() {
  return (
    <article className='rounded-xl border-2 border-border bg-card p-4 shadow-[6px_6px_0_0_var(--color-border)]'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-5 w-5 rounded-full' />
      </div>
      <Skeleton className='h-10 w-20' />
    </article>
  );
}

export function ProgressDashboardSkeleton() {
  return (
    <div className='space-y-5'>
      <section className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </section>

      <section className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </section>

      <section className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </section>

      <div className='mt-6'>
        <Skeleton className='h-10 w-40 rounded-[6px]' />
      </div>
    </div>
  );
}
