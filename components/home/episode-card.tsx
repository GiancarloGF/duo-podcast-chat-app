import { Chat, Episode } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getEpisodeBasicInfo } from '@/lib/episode-loader';
import Link from 'next/link';
import { InitializeChatButton } from './initialize-chat-button';

interface EpisodeCardProps {
  episode: Episode;
  chat: Chat | undefined;
}
export function EpisodeCard({ episode, chat }: EpisodeCardProps) {
  const basicInfo = getEpisodeBasicInfo(episode);
  const isInitialized = !!chat;

  // Calculate progress if initialized
  const totalMessages = episode.messageCount ?? episode.messages?.length ?? 0;
  const progressPercent =
    isInitialized && chat && chat.progress && totalMessages > 0
      ? Math.round((chat.progress / totalMessages) * 100)
      : 0;

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
            alt={basicInfo.title}
            className='w-full h-full object-cover transition-transform hover:scale-105 duration-500'
          />
          {isInitialized && (
            <div className='absolute top-2 right-2'>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  chat && chat.status === 'completed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                }`}
              >
                {chat && chat.status === 'completed'
                  ? 'Completado'
                  : 'En progreso'}
              </span>
            </div>
          )}
        </div>
      )}
      <CardHeader className='pt-3'>
        <CardTitle className='text-xl text-gray-900 dark:text-white line-clamp-1'>
          {basicInfo.title}
        </CardTitle>
        <CardDescription className='text-sm text-gray-600 dark:text-gray-400'>
          {basicInfo.protagonists}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 grow flex flex-col'>
        <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
          {basicInfo.description}
        </p>

        {/* Metadata */}
        {/* <div className='space-y-2 text-sm'>
                              <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                  Duración:
                                </span>
                                <span className='font-medium text-gray-900 dark:text-white'>
                                  {basicInfo.duration}
                                </span>
                              </div>
                              <div className='flex justify-between'>
                                <span className='text-gray-600 dark:text-gray-400'>
                                  Nivel:
                                </span>
                                <span className='font-medium text-gray-900 dark:text-white capitalize'>
                                  {basicInfo.difficulty}
                                </span>
                              </div>
                            </div> */}

        {/* Progress Bar (Only if initialized) */}
        {isInitialized && (
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

        {/* Tags */}
        <div className='flex flex-wrap gap-2'>
          {basicInfo.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className='text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full'
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <div className='mt-auto pt-4'>
          {isInitialized ? (
            <Link href={`/chat/${chat?.id}`}>
              <Button className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'>
                Continuar
              </Button>
            </Link>
          ) : (
            <InitializeChatButton episodeId={episode.id} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
