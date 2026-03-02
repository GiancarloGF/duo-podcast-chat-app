'use client';

import { Button } from '@/shared/presentation/components/ui/button';
import { useState } from 'react';
import { startChatByEpisode } from '@/features/stories/presentation/actions';

export function InitializeChatButton({ episodeId }: { episodeId: string }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initializeChat = async () => {
    setIsInitializing(true);
    setErrorMessage(null);
    try {
      await startChatByEpisode(episodeId);
    } catch (error) {
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') return;
      console.error('Ha ocurrido un error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar el episodio.'
      );
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Button
        onClick={initializeChat}
        className='w-full'
      >
        {isInitializing ? 'Cargando...' : 'COMENZAR'}
      </Button>
      {errorMessage && (
        <p className='text-sm font-medium text-destructive'>{errorMessage}</p>
      )}
    </div>
  );
}
