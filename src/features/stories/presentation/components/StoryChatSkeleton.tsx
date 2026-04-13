import { Skeleton } from '@/shared/presentation/components/ui/skeleton';

export function StoryChatSkeleton() {
  return (
    <div className='min-h-screen flex flex-col'>
      <header className='sticky top-0 z-40 border-b-2 border-border bg-card p-4'>
        <div className='mx-auto flex max-w-4xl items-start gap-4 sm:gap-6'>
          <Skeleton className='h-9 w-24 rounded-[6px] border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]' />

          <div className='flex w-full flex-col gap-3'>
            <Skeleton className='h-6 w-2/3' />
            <div className='flex items-center justify-between gap-3'>
              <Skeleton className='h-4 w-28' />
              <div className='flex min-w-0 items-center gap-3'>
                <Skeleton className='h-4 w-10' />
                <Skeleton className='h-3 w-24 rounded-[6px]' />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className='flex-1 overflow-y-auto p-0 sm:p-4'>
        <div className='mx-auto flex w-full max-w-4xl flex-col gap-4 pb-24'>
          <div className='mt-4 flex gap-3'>
            <Skeleton className='h-8 w-8 rounded-[6px]' />
            <div className='w-full max-w-2xl rounded-[10px] border-2 border-border bg-card px-5 py-4 shadow-[4px_4px_0_0_var(--color-border)]'>
              <Skeleton className='h-4 w-1/4' />
              <Skeleton className='mt-3 h-4 w-full' />
              <Skeleton className='mt-2 h-4 w-5/6' />
            </div>
          </div>

          <div className='flex justify-end'>
            <div className='w-full max-w-xl rounded-[10px] border-2 border-border bg-secondary px-5 py-4 shadow-[4px_4px_0_0_var(--color-border)]'>
              <Skeleton className='h-4 w-2/3 ml-auto' />
            </div>
          </div>

          <div className='flex gap-3'>
            <Skeleton className='h-8 w-8 rounded-[6px]' />
            <div className='w-full max-w-2xl rounded-[10px] border-2 border-border bg-card px-5 py-4 shadow-[4px_4px_0_0_var(--color-border)]'>
              <Skeleton className='h-4 w-1/5' />
              <Skeleton className='mt-3 h-4 w-full' />
              <Skeleton className='mt-2 h-4 w-4/5' />
              <div className='mt-4 rounded-[8px] border-2 border-border bg-card p-2'>
                <Skeleton className='h-24 w-full rounded-[6px]' />
                <div className='mt-3 flex justify-end'>
                  <Skeleton className='h-9 w-24 rounded-[6px]' />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className='fixed bottom-0 left-0 right-0 z-50 border-t-2 border-border bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:sticky md:pb-6'>
        <div className='mx-auto max-w-4xl'>
          <div className='flex justify-center'>
            <Skeleton className='h-11 w-40 rounded-[6px] border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]' />
          </div>
        </div>
      </footer>
    </div>
  );
}
