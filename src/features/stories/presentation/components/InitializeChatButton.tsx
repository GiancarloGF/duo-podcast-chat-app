'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/shared/presentation/components/ui/button';
import { startChatByEpisode } from '@/features/stories/presentation/actions';

export function InitializeChatButton({ episodeId }: { episodeId: string }) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function initializeChat(): void {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await startChatByEpisode(episodeId);
      } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
          return;
        }

        console.error('Ha ocurrido un error:', error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'No fue posible iniciar el episodio.',
        );
      }
    });
  }

  return (
    <div className='space-y-2'>
      <Button
        onClick={initializeChat}
        className='w-full'
        disabled={isPending}
      >
        {isPending ? 'Cargando...' : 'COMENZAR'}
      </Button>
      {errorMessage && (
        <p className='text-sm font-medium text-destructive'>{errorMessage}</p>
      )}
    </div>
  );
}
