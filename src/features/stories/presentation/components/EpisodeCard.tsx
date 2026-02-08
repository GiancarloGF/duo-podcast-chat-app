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
      className='hover:shadow-lg transition-shadow border-0 bg-white dark:bg-slate-800 pt-0! pb-6 overflow-hidden flex flex-col h-full min-h-[520px] rounded-lg'
    >
      {episode.imageUrl && (
        <div className='relative w-full h-48 bg-gray-200 dark:bg-gray-700'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={episode.imageUrl}
            alt={episode.title}
            className='w-full h-full object-cover transition-transform hover:scale-105 duration-500'
          />
          {isStarted && (
            <div className='absolute top-2 right-2'>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  episode.status === 'completed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}
              >
                {episode.status === 'completed' ? 'Completado' : 'En progreso'}
              </span>
            </div>
          )}
        </div>
      )}
      <CardHeader className='pt-3'>
        <CardTitle className='text-xl text-gray-900 dark:text-white line-clamp-1'>
          {episode.title}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 grow flex flex-col'>
        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
          {episode.summaryText}
        </p>

        {isStarted && (
          <div className='space-y-2'>
            <div className='flex justify-between text-xs'>
              <span className='text-gray-600 dark:text-gray-400'>Progreso</span>
              <span className='font-medium text-gray-900 dark:text-white'>
                {progressPercent}%
              </span>
            </div>
            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
              <div
                className='bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <div className='mt-auto pt-4'>
          {episode.status === 'started' && (
            <Link href={`/chat/${episode.progressId}`}>
              <Button className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'>
                Continuar
              </Button>
            </Link>
          )}
          {episode.status === 'new' && (
            <InitializeChatButton episodeId={episode.id} />
          )}
          {episode.status === 'completed' && (
            <div className='w-full text-center py-2 px-4 rounded-lg bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium'>
              ✓ Completado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
