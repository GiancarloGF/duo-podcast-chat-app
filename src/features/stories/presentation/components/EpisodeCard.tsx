import { EpisodeWithProgressDto } from '@/features/stories/application/dto/EpisodeWithProgress.dto';
import { Button } from '@/shared/presentation/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/presentation/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { InitializeChatButton } from './InitializeChatButton';

interface EpisodeCardProps {
  episode: EpisodeWithProgressDto;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const showProgress = episode.status !== 'new';
  const progressPercent = episode.percentCompleted;
  const episodeTitle = `${episode.number}. ${episode.title}`;
  const badgeLabel =
    episode.displaySlot === 'previous'
      ? 'Anterior'
      : episode.displaySlot === 'current'
        ? 'Actual'
        : 'Siguiente';
  const badgeClassName =
    episode.displaySlot === 'previous'
      ? 'bg-accent text-accent-foreground'
      : episode.displaySlot === 'current'
        ? 'bg-primary text-primary-foreground'
        : 'bg-secondary text-secondary-foreground';
  const slotDescription =
    episode.displaySlot === 'previous'
      ? 'Ya completaste este episodio.'
      : episode.displaySlot === 'current'
        ? episode.status === 'started'
          ? 'Retoma tu progreso y termina la historia actual.'
          : 'Este es el episodio que debes completar ahora.'
        : 'Se desbloquea cuando completes el episodio actual.';

  return (
    <Card
      key={episode.id}
      className={`transition-all bg-card pt-0! pb-6 overflow-hidden flex flex-col h-full min-h-[520px] rounded-[10px] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-border)] ${
        episode.displaySlot === 'next' ? 'opacity-80' : ''
      }`}
    >
      {episode.imageUrl && (
        <div className='relative w-full h-48 bg-muted border-b-2 border-border'>
          <Image
            src={episode.imageUrl}
            alt={episodeTitle}
            fill
            sizes='(max-width: 1024px) 100vw, 33vw'
            className='object-cover transition-transform hover:scale-105 duration-500'
          />
          <div className='absolute top-2 left-2'>
            <span
              className={`px-2 py-1 rounded-[6px] text-[11px] font-bold uppercase tracking-wide border-2 border-border shadow-[2px_2px_0_0_var(--color-border)] ${badgeClassName}`}
            >
              {badgeLabel}
            </span>
          </div>
          {/* {episode.status !== 'new' && (
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
          )} */}
        </div>
      )}
      <CardHeader className='pt-1 sm:pt-3'>
        <CardTitle className='text-base sm:text-xl text-foreground'>
          {episodeTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 grow flex flex-col'>
        <p className='text-base text-muted-foreground'>
          {episode.summaryText}
        </p>
        <p className='text-sm font-medium text-foreground'>
          {slotDescription}
        </p>

        {showProgress && (
          <div className='space-y-2'>
            <div className='flex justify-between text-xs'>
              <span className='text-muted-foreground font-semibold uppercase'>Progreso</span>
              <span className='font-bold text-foreground'>
                {progressPercent}%
              </span>
            </div>
            <div className='w-full bg-muted rounded-lg h-3 border-2 border-border'>
              <div
                className='bg-primary h-full transition-all'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className='mt-auto pt-4'>
          {episode.displaySlot === 'current' && episode.status === 'started' && (
            <Link href={`/stories/chat/${episode.progressId}`}>
              <Button className='w-full'>
                Continuar
              </Button>
            </Link>
          )}
          {episode.displaySlot === 'current' && episode.status === 'new' && (
            <InitializeChatButton episodeId={episode.id} />
          )}
          {episode.displaySlot === 'previous' && episode.status === 'completed' && (
            <div className='w-full text-center py-2 px-4 rounded-[6px] bg-accent text-accent-foreground font-bold uppercase tracking-wide border-2 border-border shadow-[3px_3px_0_0_var(--color-border)]'>
              ✓ Completado
            </div>
          )}
          {episode.displaySlot === 'next' && (
            <div className='w-full text-center py-2 px-4 rounded-[6px] bg-secondary text-secondary-foreground font-bold uppercase tracking-wide border-2 border-border shadow-[3px_3px_0_0_var(--color-border)]'>
              Proximamente
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
