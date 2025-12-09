'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useChatStore } from '@/lib/store/useChatStore';
import { getEpisodeBasicInfo } from '@/lib/episode-loader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserDashboard } from '@/components/stats/user-dashboard';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { episodes, chats, loadData, initializeChat, isLoading } =
    useChatStore();
  const router = useRouter();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleStartChat = async (episodeId: string) => {
    const chat = await initializeChat(episodeId);
    if (chat) {
      router.push(`/chat/${chat._id || chat.id}`);
    }
  };

  // Skeleton loader component
  const EpisodeCardSkeleton = () => (
    <Card className='border-0 bg-white dark:bg-slate-800 pt-0! pb-6 overflow-hidden flex flex-col h-full min-h-[520px] rounded-lg'>
      {/* Image skeleton */}
      <div className='relative w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse' />

      {/* Header skeleton */}
      <CardHeader className='pt-3'>
        <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2' />
        <div className='h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
      </CardHeader>

      {/* Content skeleton */}
      <CardContent className='space-y-4 grow flex flex-col'>
        {/* Description skeleton */}
        <div className='space-y-2'>
          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
          <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
          <div className='h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
        </div>

        {/* Tags skeleton */}
        <div className='flex flex-wrap gap-2'>
          <div className='h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse' />
          <div className='h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse' />
        </div>

        {/* Button skeleton */}
        <div className='mt-auto pt-4'>
          <div className='h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
      <div className='max-w-6xl mx-auto py-12'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Relatos en Inglés
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-300'>
            Practica inglés traduciendo historias reales y fascinantes
          </p>
        </div>

        {/* User Dashboard Stats */}
        {/* <div className='mb-8'>
          <UserDashboard />
        </div> */}

        {/* Episodes Sections */}
        {isLoading ? (
          <div className='space-y-8'>
            {/* Skeleton for "En Progreso" section */}
            <div>
              <div className='h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4' />
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3].map((i) => (
                  <EpisodeCardSkeleton key={i} />
                ))}
              </div>
            </div>
            {/* Skeleton for "Disponibles" section */}
            <div>
              <div className='h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4' />
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <EpisodeCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        ) : episodes && episodes.length > 0 ? (
          <div className='space-y-8'>
            {/* Helper function to render episode card */}
            {(() => {
              const renderEpisodeCard = (episode: (typeof episodes)[0]) => {
                const basicInfo = getEpisodeBasicInfo(episode);
                const chat = chats.find((c) => c.episodeId === episode.id);
                const isInitialized = !!chat;

                // Calculate progress if initialized
                const totalMessages =
                  episode.messageCount ?? episode.messages?.length ?? 0;
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
                            <span className='text-gray-600 dark:text-gray-400'>
                              Progreso
                            </span>
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
                          <Link href={`/chat/${chat?._id || chat?.id}`}>
                            <Button className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'>
                              Continuar
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            onClick={() => handleStartChat(episode.id)}
                            className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
                          >
                            Comenzar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              };

              // Separate episodes into two groups
              const episodesInProgress = episodes.filter((episode) => {
                const chat = chats.find((c) => c.episodeId === episode.id);
                return !!chat && chat.status !== 'completed';
              });

              const availableEpisodes = episodes.filter((episode) => {
                const chat = chats.find((c) => c.episodeId === episode.id);
                return !chat;
              });

              return (
                <>
                  {/* En Progreso Section */}
                  {episodesInProgress.length > 0 && (
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                        En Progreso
                      </h2>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {episodesInProgress.map((episode) =>
                          renderEpisodeCard(episode)
                        )}
                      </div>
                    </div>
                  )}

                  {/* Disponibles Section */}
                  {availableEpisodes.length > 0 && (
                    <div>
                      <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                        Disponibles
                      </h2>
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {availableEpisodes.map((episode) =>
                          renderEpisodeCard(episode)
                        )}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className='text-center py-12'>
            <p className='text-gray-600 dark:text-gray-400 text-lg'>
              No hay episodios disponibles en este momento.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
