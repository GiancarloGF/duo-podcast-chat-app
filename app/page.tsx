import { getAllEpisodes } from '@/lib/actions/get-all-episodes';
import { getAllUserProgress } from '@/lib/actions/get-all-user-progress';
import { EpisodeCard } from '@/components/home/episode-card';
import { EpisodeWithProgress, UserProgress } from '@/lib/types';
import { CONSTANTS } from '@/constants';

export default async function Home() {
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
      if (ep.messageCount > 0) {
        percent = Math.round(
          (progress.currentMessageIndex / ep.messageCount) * 100
        );
      }
      // Capar al 100% por si acaso
      percent = Math.min(percent, 100);
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
          {enrichedEpisodes.length > 0 && (
            <div>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
                Episodios
              </h2>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {enrichedEpisodes.map((episode) => (
                  <EpisodeCard episode={episode} key={episode.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
