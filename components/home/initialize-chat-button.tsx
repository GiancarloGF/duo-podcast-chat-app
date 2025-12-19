'use client';

import { Button } from '@/components/ui/button';
import { Chat } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function InitializeChatButton({ episodeId }: { episodeId: string }) {
  const [isInitializing, setIsInitializing] = useState(false);
  const router = useRouter();

  const initializeChat = async () => {
    if (isInitializing) return;

    setIsInitializing(true);

    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      if (!res.ok) throw new Error('Failed to create chat');

      const newChat: Chat = await res.json();

      router.push(`/chat/${newChat._id || newChat.id}`);

      // set((state) => {
      //   // Avoid duplicates
      //   const exists = state.chats.find((c) => c.episodeId === episodeId);
      //   if (exists) return state;
      //   return { chats: [...state.chats, newChat] };
      // });

      return newChat;
    } catch (error) {
      console.error('Error initializing chat:', error);
      return null;
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
