import { Skeleton } from '@/shared/presentation/components/ui/skeleton';

function EpisodeCardSkeleton() {
  return (
    <article className='overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[4px_4px_0_0_var(--color-border)]'>
      <Skeleton className='h-48 w-full rounded-none' />
      <div className='space-y-4 p-5'>
        <div className='flex items-center justify-between gap-3'>
          <Skeleton className='h-6 w-20 rounded-[6px]' />
          <Skeleton className='h-4 w-12' />
        </div>
        <Skeleton className='h-7 w-3/4' />
        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-5/6' />
        <Skeleton className='h-4 w-2/3' />
        <div className='pt-4'>
          <Skeleton className='h-10 w-full rounded-[6px]' />
        </div>
      </div>
    </article>
  );
}

export function StoriesWindowSkeleton() {
  return (
    <div className='space-y-8'>
      <div>
        <div className='mb-6 flex items-center gap-3'>
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-7 w-24 rounded-[6px]' />
        </div>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
          <EpisodeCardSkeleton />
          <EpisodeCardSkeleton />
          <EpisodeCardSkeleton />
        </div>
      </div>
    </div>
  );
}
