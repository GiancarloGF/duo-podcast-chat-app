import { Suspense } from 'react';
import Link from 'next/link';
import { HeaderAuthSkeleton } from '@/shared/presentation/components/HeaderAuthSkeleton';
import { HeaderAuthStatus } from '@/shared/presentation/components/HeaderAuthStatus';

export function Header() {
  return (
    <header className='w-full border-b-2 border-border bg-card'>
      <div className='mx-auto flex min-h-18 w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex min-w-0 flex-1 items-center'>
          <Link className='flex flex-col leading-tight' href='/'>
            <span className='text-lg font-black uppercase tracking-wide text-foreground sm:text-xl'>
              Ruway App
            </span>
            <span className='text-[11px] font-semibold uppercase text-muted-foreground sm:text-xs'>
              Practice your English
            </span>
          </Link>
        </div>

        <div className='flex shrink-0 items-center'>
          <Suspense fallback={<HeaderAuthSkeleton />}>
            <HeaderAuthStatus />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
