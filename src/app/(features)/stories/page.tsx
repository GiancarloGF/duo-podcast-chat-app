import { getAllEpisodesAction, getAllUserProgress } from '@/features/stories/presentation/actions';
import { EpisodeCard } from '@/features/stories/presentation/components/EpisodeCard';
import type { EpisodeWithProgressDto } from '@/features/stories/application/dto/EpisodeWithProgress.dto';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { Header } from '@/shared/presentation/components/Header';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/presentation/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';

export default async function StoriesPage() {
  const [episodes, userProgressList, { currentUser }] = await Promise.all([
    getAllEpisodesAction(),
    getAllUserProgress(),
    getAuthenticatedAppForUser(),
  ]);

  const serializableUser = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email || null,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
      }
    : null;

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
    <>
      <Header initialUser={serializableUser} />
      <main className='min-h-screen p-4'>
        <div className='max-w-6xl mx-auto py-12'>
          <Breadcrumb className='mb-6'>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Relatos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className='mb-12 rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
            <h1 className='text-4xl font-black text-foreground mb-2'>
              Relatos en Inglés
            </h1>
            <p className='text-lg text-muted-foreground font-medium'>
              Practica inglés traduciendo historias reales y fascinantes
            </p>
          </div>

          <div className='space-y-12'>
            {inProgressEpisodes.length > 0 && (
              <div>
                <div className='flex items-center gap-3 mb-6'>
                  <h2 className='text-2xl font-black text-foreground'>
                    En Progreso
                  </h2>
                  <span className='px-3 py-1 rounded-[6px] text-xs font-bold uppercase tracking-wide bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0_0_var(--color-border)]'>
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
                  <h2 className='text-2xl font-black text-foreground'>
                    Completados
                  </h2>
                  <span className='px-3 py-1 rounded-[6px] text-xs font-bold uppercase tracking-wide bg-accent text-accent-foreground border-2 border-border shadow-[2px_2px_0_0_var(--color-border)]'>
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
                  <h2 className='text-2xl font-black text-foreground'>
                    Disponibles
                  </h2>
                  <span className='px-3 py-1 rounded-[6px] text-xs font-bold uppercase tracking-wide bg-secondary text-secondary-foreground border-2 border-border shadow-[2px_2px_0_0_var(--color-border)]'>
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
              <div className='text-center py-12 rounded-[10px] border-2 border-border bg-card shadow-[6px_6px_0_0_var(--color-border)]'>
                <p className='text-lg text-muted-foreground font-semibold'>
                  No hay episodios disponibles en este momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
