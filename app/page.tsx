import Link from 'next/link';
import { getEpisodeBasicInfo } from '@/lib/episode-loader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getAllEpisodes } from '@/lib/db/get-all-episodes';
import { getAllChats } from '@/lib/db/get-all-chats';
import { InitializeChatButton } from '@/components/home/initialize-chat-button';
import { EpisodeCard } from '@/components/home/episode-card';

export default async function Home() {
  const episodes = await getAllEpisodes();
  console.log("Episodios cargados", episodes);
  const chats = await getAllChats();
  console.log("Chats cargados", chats);
  // const { episodes, chats, loadData, initializeChat, isLoading } =
  //   useChatStore();
  // const router = useRouter();

  // useEffect(() => {
  //   loadData();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []); // Only run once on mount

  // const handleStartChat = async (episodeId: string) => {
  //   console.log('handleStartChat:episodeId', episodeId);
  //   // const chat = await initializeChat(episodeId);
  //   // if (chat) {
  //   //   router.push(`/chat/${chat._id || chat.id}`);
  //   // }
  // };

  // Skeleton loader component
  // const EpisodeCardSkeleton = () => (
  //   <Card className='border-0 bg-white dark:bg-slate-800 pt-0! pb-6 overflow-hidden flex flex-col h-full min-h-[520px] rounded-lg'>
  //     {/* Image skeleton */}
  //     <div className='relative w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse' />

  //     {/* Header skeleton */}
  //     <CardHeader className='pt-3'>
  //       <div className='h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2' />
  //       <div className='h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
  //     </CardHeader>

  //     {/* Content skeleton */}
  //     <CardContent className='space-y-4 grow flex flex-col'>
  //       {/* Description skeleton */}
  //       <div className='space-y-2'>
  //         <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
  //         <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
  //         <div className='h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
  //       </div>

  //       {/* Tags skeleton */}
  //       <div className='flex flex-wrap gap-2'>
  //         <div className='h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse' />
  //         <div className='h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse' />
  //       </div>

  //       {/* Button skeleton */}
  //       <div className='mt-auto pt-4'>
  //         <div className='h-10 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
  //       </div>
  //     </CardContent>
  //   </Card>
  // );

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
        <div className='space-y-8'>
          {/* Helper function to render episode card */}
          {(() => {
            const renderEpisodeCard = (episode: (typeof episodes)[0]) => {
              const chat = chats.find((c) => c.episodeId === episode.id);
              return <EpisodeCard episode={episode} chat={chat} key={episode.id} />;
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
      </div>
    </main>
  );
}
