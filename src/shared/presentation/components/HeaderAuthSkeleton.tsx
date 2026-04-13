import { Skeleton } from '@/shared/presentation/components/ui/skeleton';

export function HeaderAuthSkeleton() {
  return (
    <div className='flex items-center gap-2'>
      <Skeleton className='h-10 w-28 rounded-[6px] border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]' />
      <Skeleton className='h-10 w-10 rounded-[6px] border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]' />
    </div>
  );
}
