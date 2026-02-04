import { getAllEpisodes } from '@/lib/actions/get-all-episodes';
import { getAllUserProgress } from '@/lib/actions/get-all-user-progress';
import { EpisodeCard } from '@/components/home/episode-card';
import { EpisodeWithProgress, UserProgress } from '@/lib/types';
import { CONSTANTS } from '@/constants';

export const dynamic = 'force-dynamic';

export default async function StoriesPage() {
  // Strategy: "Fetch Paralelo + Map Lookup"
  const [episodes, userProgressList] = await Promise.all([
    getAllEpisodes(),
    getAllUserProgress(CONSTANTS.FAKE_USER_ID),
  ]);

  console.log('Episodios cargados', episodes.length);
  console.log('Progreso cargado', userProgressList.length);

  // Convertimos el array de progresos en un Objeto/Mapa donde la CLAVE es el ID del episodio.
  // Esto permite buscar en tiempo O(1) en lugar de recorrer el array una y otra vez.
  const progressMap: Map<string, UserProgress> = new Map();

  userProgressList.forEach((prog) => {
    // Asumiendo que episodeId viene como ObjectId o String
    progressMap.set(prog.episodeId.toString(), prog);
  });

  const enrichedEpisodes = episodes.map((ep) => {
    const epId = ep.id;
    const progress = progressMap.get(epId); // Búsqueda instantánea

    let status = 'new';
    let percent = 0;
    let lastActive = null;
    let currentIndex = 0;

    if (progress) {
      status = progress.status; // 'started' o 'completed'
      currentIndex = progress.currentMessageIndex;
      lastActive = progress.lastActiveAt;

      // Cálculo seguro del porcentaje
      // Usamos (currentMessageIndex + 1) para que coincida con el chat page (Message X of Y)
      // Si el índice es 0, es el mensaje 1, entonces 1/count.
      if (ep.messageCount > 0) {
        percent = Math.round(
          ((progress.currentMessageIndex + 1) / ep.messageCount) * 100,
        );
      }
      // Capar al 100% por si acaso
      percent = Math.min(percent, 100);

      // Si está completado, forzamos 100%
      if (status === 'completed') {
        percent = 100;
      }
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
    } as EpisodeWithProgress;
  });

  // Separate episodes into three categories
  const inProgressEpisodes = enrichedEpisodes.filter(
    (ep) => ep.status === 'started',
  );
  const completedEpisodes = enrichedEpisodes.filter(
    (ep) => ep.status === 'completed',
  );
  const availableEpisodes = enrichedEpisodes.filter(
    (ep) => ep.status === 'new',
  );

  // Sort in-progress episodes by lastActiveAt (most recent first)
  inProgressEpisodes.sort((a, b) => {
    if (!a.lastActiveAt && !b.lastActiveAt) return 0;
    if (!a.lastActiveAt) return 1;
    if (!b.lastActiveAt) return -1;
    return (
      new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  });

  // Sort completed episodes by lastActiveAt (most recent first)
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
        <div className='space-y-12'>
          {/* En Progreso Section */}
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

          {/* Completados Section */}
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

          {/* Disponibles Section */}
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

          {/* Empty State */}
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
