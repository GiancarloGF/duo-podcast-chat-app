import { Skeleton } from '@/shared/presentation/components/ui/skeleton';

export function PracticeSessionSkeleton() {
  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-4 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-4 space-y-3'>
        <div className='flex items-center justify-between gap-3'>
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-16' />
        </div>
        <Skeleton className='h-3 w-full rounded-[6px]' />
      </div>

      <div className='space-y-5'>
        <Skeleton className='h-72 w-full rounded-[10px]' />
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <Skeleton className='h-11 w-full rounded-[6px]' />
          <Skeleton className='h-11 w-full rounded-[6px]' />
        </div>
      </div>
    </section>
  );
}
