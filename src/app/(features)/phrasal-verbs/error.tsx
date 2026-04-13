'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/presentation/components/ui/button';

interface PhrasalVerbsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PhrasalVerbsError({
  error,
  reset,
}: PhrasalVerbsErrorProps) {
  useEffect(() => {
    console.error('Phrasal verbs segment failed', error);
  }, [error]);

  return (
    <section className='rounded-[10px] border-2 border-red-700 bg-red-100 p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <h1 className='text-xl font-black text-red-900'>No pudimos cargar esta vista</h1>
      <p className='mt-2 text-sm font-medium text-red-900'>
        Reintenta la carga o vuelve a entrar en unos momentos.
      </p>
      <Button className='mt-4' onClick={reset} variant='outline'>
        Reintentar
      </Button>
    </section>
  );
}
