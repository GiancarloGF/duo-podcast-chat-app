'use client';

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import { useStoryChatSession } from '@/features/stories/presentation/hooks/useStoryChatSession';

type StoryChatSessionValue = ReturnType<typeof useStoryChatSession>;

const StoryChatSessionContext = createContext<StoryChatSessionValue | null>(null);

interface StoryChatSessionProviderProps {
  children: ReactNode;
  episode: Episode;
  initialUserProgress: UserProgress;
}

export function StoryChatSessionProvider({
  children,
  episode,
  initialUserProgress,
}: StoryChatSessionProviderProps) {
  const value = useStoryChatSession({
    episode,
    initialUserProgress,
  });

  return (
    <StoryChatSessionContext.Provider value={value}>
      {children}
    </StoryChatSessionContext.Provider>
  );
}

export function useStoryChatSessionContext(): StoryChatSessionValue {
  const value = useContext(StoryChatSessionContext);

  if (!value) {
    throw new Error('Story chat session context missing.');
  }

  return value;
}
