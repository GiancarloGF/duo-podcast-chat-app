'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/presentation/components/ui/button';

interface StoriesErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StoriesError({ error, reset }: StoriesErrorProps) {
  useEffect(() => {
    console.error('Stories segment failed', error);
  }, [error]);

  return (
    <section className='rounded-[10px] border-2 border-red-700 bg-red-100 p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <h1 className='text-xl font-black text-red-900'>No pudimos cargar Stories</h1>
      <p className='mt-2 text-sm font-medium text-red-900'>
        Intenta nuevamente o vuelve más tarde.
      </p>
      <Button className='mt-4' onClick={reset} variant='outline'>
        Reintentar
      </Button>
    </section>
  );
}
