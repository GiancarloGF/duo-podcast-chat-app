'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { startChatByEpisode } from '@/lib/actions/start-episode';

export function InitializeChatButton({ episodeId }: { episodeId: string }) {
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeChat = async () => {
    setIsInitializing(true);
    try {
      // Llamamos al Server Action
      // Nota: El redirect sucede en el servidor, así que no necesitamos router.push manual
      await startChatByEpisode(episodeId);
    } catch (error) {
      if (error instanceof Error && error.message === "NEXT_REDIRECT") return;
      // toast.error('Error al iniciar el episodio');
      console.log('Ha ocurrido un error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Button
      onClick={initializeChat}
      className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
    >
      {isInitializing ? 'Cargando...' : 'Comenzar'}
    </Button>
  );
}
