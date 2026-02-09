'use client';

import { Button } from '@/shared/presentation/components/ui/button';
import { useState } from 'react';
import { startChatByEpisode } from '@/features/stories/presentation/actions';

export function InitializeChatButton({ episodeId }: { episodeId: string }) {
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeChat = async () => {
    setIsInitializing(true);
    try {
      await startChatByEpisode(episodeId);
    } catch (error) {
      if (error instanceof Error && error.message === 'NEXT_REDIRECT') return;
      console.log('Ha ocurrido un error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Button
      onClick={initializeChat}
      className='w-full'
    >
      {isInitializing ? 'Cargando...' : 'Comenzar'}
    </Button>
  );
}
