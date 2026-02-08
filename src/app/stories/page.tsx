import { getAllEpisodesAction } from '@/features/stories/presentation/actions';
import { getAllUserProgress } from '@/features/translations/presentation/actions';
import { EpisodeCard } from '@/features/stories/presentation/components/EpisodeCard';
import type { EpisodeWithProgressDto } from '@/features/stories/application/dto/EpisodeWithProgress.dto';
import type { UserProgress } from '@/features/translations/domain/entities/UserProgress';
import { getCurrentUserId } from '@/features/auth/presentation/actions';

export const dynamic = 'force-dynamic';

export default async function StoriesPage() {
  const userId = await getCurrentUserId();
  const [episodes, userProgressList] = await Promise.all([
    getAllEpisodesAction(),
    getAllUserProgress(userId),
  ]);

  const progressMap: Map<string, UserProgress> = new Map();
  userProgressList.forEach((prog) => {
    progressMap.set(prog.episodeId, prog);
  });

  const enrichedEpisodes: EpisodeWithProgressDto[] = episodes.map((ep) => {
    const epId = ep.id;
    const progress = progressMap.get(epId);
    let status: 'new' | 'started' | 'completed' = 'new';
    let percent = 0;
    let lastActive: Date | null = null;
    let currentIndex = 0;

    if (progress) {
      status = progress.status;
      currentIndex = progress.currentMessageIndex;
      lastActive = progress.lastActiveAt;
      if (ep.messageCount > 0) {
        percent = Math.round(
          ((progress.currentMessageIndex + 1) / ep.messageCount) * 100
        );
      }
      percent = Math.min(percent, 100);
      if (status === 'completed') percent = 100;
    }

    return {
      id: epId,
      slug: ep.slug,
      title: ep.title,
      imageUrl: ep.imageUrl,
      messageCount: ep.messageCount,
      progressId: progress?.id,
      status,
      summaryText: ep.summaryText,
      percentCompleted: percent,
      lastActiveAt: lastActive,
      currentMessageIndex: currentIndex,
    };
  });

  const inProgressEpisodes = enrichedEpisodes.filter(
    (ep) => ep.status === 'started'
  );
  const completedEpisodes = enrichedEpisodes.filter(
    (ep) => ep.status === 'completed'
  );
  const availableEpisodes = enrichedEpisodes.filter((ep) => ep.status === 'new');

  inProgressEpisodes.sort((a, b) => {
    if (!a.lastActiveAt && !b.lastActiveAt) return 0;
    if (!a.lastActiveAt) return 1;
    if (!b.lastActiveAt) return -1;
    return (
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  });

  completedEpisodes.sort((a, b) => {
    if (!a.lastActiveAt && !b.lastActiveAt) return 0;
    if (!a.lastActiveAt) return 1;
    if (!b.lastActiveAt) return -1;
    return (
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  });

  return (
    <main className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-4'>
      <div className='max-w-6xl mx-auto py-12'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Relatos en Inglés
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-300'>
            Practica inglés traduciendo historias reales y fascinantes
          </p>
        </div>

        <div className='space-y-12'>
          {inProgressEpisodes.length > 0 && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  En Progreso
                </h2>
                <span className='px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'>
                  {inProgressEpisodes.length}
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {inProgressEpisodes.map((episode) => (
                  <EpisodeCard episode={episode} key={episode.id} />
                ))}
              </div>
            </div>
          )}

          {completedEpisodes.length > 0 && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  Completados
                </h2>
                <span className='px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'>
                  {completedEpisodes.length}
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {completedEpisodes.map((episode) => (
                  <EpisodeCard episode={episode} key={episode.id} />
                ))}
              </div>
            </div>
          )}

          {availableEpisodes.length > 0 && (
            <div>
              <div className='flex items-center gap-3 mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  Disponibles
                </h2>
                <span className='px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
                  {availableEpisodes.length}
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {availableEpisodes.map((episode) => (
                  <EpisodeCard episode={episode} key={episode.id} />
                ))}
              </div>
            </div>
          )}

          {enrichedEpisodes.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-lg text-gray-600 dark:text-gray-400'>
                No hay episodios disponibles en este momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
