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
      router.push(`/episode/${episodeId}`); // Use episode ID as param, logic in page will look up chat
    }
  };

  if (isLoading && episodes.length === 0) {
    return (
      <main className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
        <div className='max-w-6xl mx-auto py-12'>
          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>
              Relatos en Inglés
            </h1>
            <p className='text-gray-600 dark:text-gray-300 mb-8'>
              Cargando episodios...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
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
        <div className='mb-12'>
          <UserDashboard />
        </div>

        {/* Episodes Grid */}
        {episodes && episodes.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {episodes.map((episode) => {
              const basicInfo = getEpisodeBasicInfo(episode);
              const chat = chats.find((c) => c.episodeId === episode.id);
              const isInitialized = !!chat;

              // Calculate progress if initialized
              const progressPercent =
                isInitialized && chat.progress && episode.messages.length > 0
                  ? Math.round((chat.progress / episode.messages.length) * 100)
                  : 0;

              return (
                <Card
                  key={episode.id}
                  className='hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white dark:bg-slate-800'
                >
                  <CardHeader>
                    <CardTitle className='text-xl text-gray-900 dark:text-white'>
                      {basicInfo.title}
                    </CardTitle>
                    <CardDescription className='text-sm text-gray-600 dark:text-gray-400'>
                      {basicInfo.protagonists}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <p className='text-sm text-gray-700 dark:text-gray-300 line-clamp-3'>
                      {basicInfo.description}
                    </p>

                    {/* Metadata */}
                    <div className='space-y-2 text-sm'>
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
                    </div>

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
                    <div className='mt-4'>
                      {isInitialized ? (
                        <Link href={`/episode/${episode.id}`}>
                          <Button className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'>
                            Continuar ({chat.status})
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
            })}
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
