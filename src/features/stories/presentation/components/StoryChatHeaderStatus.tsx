'use client';

import { useMemo } from 'react';
import { useStoryChatSessionContext } from '@/features/stories/presentation/components/StoryChatSessionProvider';

interface StoryChatHeaderStatusProps {
  totalMessages: number;
}

export function StoryChatHeaderStatus({
  totalMessages,
}: StoryChatHeaderStatusProps) {
  const { userProgress } = useStoryChatSessionContext();

  const progressPercent = useMemo(() => {
    if (totalMessages === 0) {
      return 0;
    }

    return Math.round(((userProgress.currentMessageIndex + 1) / totalMessages) * 100);
  }, [totalMessages, userProgress.currentMessageIndex]);

  return (
    <div className='flex justify-between gap-2 w-full'>
      <p className='text-xs text-muted-foreground font-semibold uppercase shrink-0'>
        Mensaje {Math.min(userProgress.currentMessageIndex + 1, totalMessages)} de{' '}
        {totalMessages}
      </p>
      <div className='flex items-center justify-between gap-3'>
        <span className='text-xs font-bold text-foreground min-w-10 text-right'>
          {progressPercent}%
        </span>
        <div className='w-24 sm:w-32'>
          <div className='w-full bg-muted rounded-lg h-3 border-2 border-border'>
            <div
              className='bg-primary h-full transition-all'
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
