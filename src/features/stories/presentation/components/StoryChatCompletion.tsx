'use client';

import { Home } from 'lucide-react';
import Image from 'next/image';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import { getStoryChatSummary } from '@/features/stories/presentation/chat/storyChatSummary';
import { Button } from '@/shared/presentation/components/ui/button';

interface StoryChatCompletionProps {
  episode: Episode;
  userProgress: UserProgress;
  onBackToStories: () => void;
}

// End-of-episode summary card. The component stays intentionally dumb and only
// consumes precomputed interaction data plus a navigation callback.
export function StoryChatCompletion({
  episode,
  userProgress,
  onBackToStories,
}: StoryChatCompletionProps) {
  const summary = getStoryChatSummary(userProgress.interactions);

  return (
    <div className='min-h-screen p-4 flex items-center justify-center'>
      <div className='max-w-md w-full'>
        <div className='bg-card rounded-[10px] border-2 border-border shadow-[8px_8px_0_0_var(--color-border)] overflow-hidden'>
          <div className='relative h-48 w-full bg-muted border-b-2 border-border'>
            <Image
              src={episode.imageUrl}
              alt={episode.title}
              fill
              sizes='(max-width: 768px) 100vw, 448px'
              className='object-cover'
            />
            <div className='absolute inset-0 bg-[rgba(25,21,20,0.4)] flex items-end p-6'>
              <div>
                <div className='text-white text-sm font-bold uppercase tracking-wider mb-1'>
                  Episodio Completado
                </div>
                <h1 className='text-2xl font-black text-white leading-tight'>
                  {episode.title}
                </h1>
              </div>
            </div>
          </div>

          <div className='p-6'>
            <div className='mb-6'>
              <h3 className='text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2'>
                Resumen
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed line-clamp-3 font-medium'>
                {episode.summaryText}
              </p>
            </div>

            <div className='grid grid-cols-2 gap-4 mb-8'>
              <div className='bg-secondary rounded-[8px] p-4 text-center border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]'>
                <div className='text-3xl font-black text-secondary-foreground'>
                  {summary.completed}
                </div>
                <div className='text-xs font-bold text-secondary-foreground mt-1 uppercase'>
                  Traducciones
                </div>
              </div>
              <div className='bg-accent rounded-[8px] p-4 text-center border-2 border-border shadow-[4px_4px_0_0_var(--color-border)]'>
                <div className='text-3xl font-black text-accent-foreground'>
                  {summary.averageScore}%
                </div>
                <div className='text-xs font-bold text-accent-foreground mt-1 uppercase'>
                  Precisión Media
                </div>
              </div>
            </div>

            <Button
              onClick={onBackToStories}
              className='w-full py-6 text-lg'
            >
              <Home className='w-5 h-5 mr-2' />
              Volver a Relatos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
