'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import { StoryChatBody } from '@/features/stories/presentation/components/StoryChatBody';
import { StoryChatFooterActions } from '@/features/stories/presentation/components/StoryChatFooterActions';
import { StoryChatHeaderStatus } from '@/features/stories/presentation/components/StoryChatHeaderStatus';
import { StoryChatSessionProvider } from '@/features/stories/presentation/components/StoryChatSessionProvider';
import { Button } from '@/shared/presentation/components/ui/button';

interface ChatContainerProps {
  initialEpisode: Episode;
  initialUserProgress: UserProgress;
}

export function ChatContainer({
  initialEpisode,
  initialUserProgress,
}: ChatContainerProps) {
  return (
    <StoryChatSessionProvider
      episode={initialEpisode}
      initialUserProgress={initialUserProgress}
    >
      <div className='min-h-screen flex flex-col'>
        <header className='bg-card border-b-2 border-border p-4 sticky top-0 z-40'>
          <div className='max-w-4xl mx-auto space-y-3 flex gap-4 sm:gap-6 items-start'>
            <Link href='/stories'>
              <Button variant='outline' size='sm' className='gap-2 shrink-0'>
                <ChevronLeft className='w-4 h-4' aria-hidden='true' />
                <span className='hidden sm:inline'>Atrás</span>
              </Button>
            </Link>

            <div className='flex flex-col gap-2 w-full'>
              <h1 className='sm:text-lg font-black text-foreground leading-tight line-clamp-2 min-w-0 flex-1'>
                {initialEpisode.title || 'Episodio'}
              </h1>
              <StoryChatHeaderStatus totalMessages={initialEpisode.messages.length} />
            </div>
          </div>
        </header>

        <StoryChatBody episode={initialEpisode} />

        <footer className='fixed md:sticky bottom-0 left-0 right-0 bg-card border-t-2 border-border p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:pb-6 z-50'>
          <div className='max-w-4xl mx-auto'>
            <div className='flex justify-center'>
              <StoryChatFooterActions />
            </div>
          </div>
        </footer>
      </div>
    </StoryChatSessionProvider>
  );
}
