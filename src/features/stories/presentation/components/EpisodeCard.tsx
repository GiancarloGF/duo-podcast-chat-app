import { EpisodeWithProgressDto } from '@/features/stories/application/dto/EpisodeWithProgress.dto';
import { Button } from '@/shared/presentation/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/presentation/components/ui/card';
import Link from 'next/link';
import { InitializeChatButton } from './InitializeChatButton';

interface EpisodeCardProps {
  episode: EpisodeWithProgressDto;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const isStarted = episode.status !== 'new';
  const progressPercent = episode.percentCompleted;

  return (
    <Card
      key={episode.id}
      className='transition-all bg-card pt-0! pb-6 overflow-hidden flex flex-col h-full min-h-[520px] rounded-[10px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--color-border)]'
    >
      {episode.imageUrl && (
        <div className='relative w-full h-48 bg-muted border-b-2 border-border'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={episode.imageUrl}
            alt={episode.title}
            className='w-full h-full object-cover transition-transform hover:scale-105 duration-500'
          />
          {isStarted && (
            <div className='absolute top-2 right-2'>
              <span
                className={`px-2 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wide border-2 border-border shadow-[2px_2px_0_0_var(--color-border)] ${
                  episode.status === 'completed'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {episode.status === 'completed' ? 'Completado' : 'En progreso'}
              </span>
            </div>
          )}
        </div>
      )}
      <CardHeader className='pt-3'>
        <CardTitle className='text-xl text-foreground line-clamp-1'>
          {episode.title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 grow flex flex-col'>
        <p className='text-sm text-muted-foreground leading-relaxed font-medium'>
          {episode.summaryText}
        </p>

        {isStarted && (
          <div className='space-y-2'>
            <div className='flex justify-between text-xs'>
              <span className='text-muted-foreground font-semibold uppercase'>Progreso</span>
              <span className='font-bold text-foreground'>
                {progressPercent}%
              </span>
            </div>
            <div className='w-full bg-muted rounded-[4px] h-3 border-2 border-border'>
              <div
                className='bg-primary h-full transition-all'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className='mt-auto pt-4'>
          {episode.status === 'started' && (
            <Link href={`/stories/chat/${episode.progressId}`}>
              <Button className='w-full'>
                Continuar
              </Button>
            </Link>
          )}
          {episode.status === 'new' && (
            <InitializeChatButton episodeId={episode.id} />
          )}
          {episode.status === 'completed' && (
            <div className='w-full text-center py-2 px-4 rounded-[6px] bg-accent text-accent-foreground font-bold uppercase tracking-wide border-2 border-border shadow-[3px_3px_0_0_var(--color-border)]'>
              ✓ Completado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
