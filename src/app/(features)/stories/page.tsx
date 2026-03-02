import { getStorySequenceWindowAction } from '@/features/stories/presentation/actions';
import { EpisodeCard } from '@/features/stories/presentation/components/EpisodeCard';
import type { EpisodeWithProgressDto } from '@/features/stories/application/dto/EpisodeWithProgress.dto';
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
  const {
    previousEpisode,
    currentEpisode,
    nextEpisode,
    currentProgress,
    hasFinishedCatalog,
    hasAnyEpisodes,
  } = await getStorySequenceWindowAction();

  const buildEpisodeDto = (
    displaySlot: 'previous' | 'current' | 'next'
  ): EpisodeWithProgressDto | null => {
    const episode =
      displaySlot === 'previous'
        ? previousEpisode
        : displaySlot === 'current'
          ? currentEpisode
          : nextEpisode;

    if (!episode) {
      return null;
    }

    const progress =
      displaySlot === 'current' ? currentProgress : null;
    const status: 'new' | 'started' | 'completed' =
      displaySlot === 'previous'
        ? 'completed'
        : displaySlot === 'current' && progress?.status === 'started'
          ? 'started'
          : 'new';

    const currentMessageIndex = progress?.currentMessageIndex ?? 0;
    const percentCompleted =
      status === 'completed'
        ? 100
        : status === 'started' && episode.messageCount > 0
          ? Math.min(
              Math.round(((currentMessageIndex + 1) / episode.messageCount) * 100),
              100
            )
          : 0;

    return {
      id: episode.id,
      slug: episode.slug,
      number: episode.number,
      title: episode.title,
      imageUrl: episode.imageUrl,
      messageCount: episode.messageCount,
      progressId: progress?.id,
      status,
      displaySlot,
      isAccessible: displaySlot === 'current',
      summaryText: episode.summaryText,
      percentCompleted,
      lastActiveAt: progress?.lastActiveAt ?? null,
      currentMessageIndex,
    };
  };

  const storyWindow = [
    buildEpisodeDto('previous'),
    buildEpisodeDto('current'),
    buildEpisodeDto('next'),
  ].filter((episode): episode is EpisodeWithProgressDto => episode !== null);

  return (
    <div className='py-4 sm:py-8'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/'>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Stories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='mb-12 rounded-[10px] border-2 border-border bg-card p-4 sm:p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <h1 className='text-lg sm:text-4xl font-black text-foreground mb-2'>
          Historias en secuencia
        </h1>
        <p className='text-sm sm:text-lg text-muted-foreground font-medium'>
          Completa un episodio a la vez. Siempre veras tu avance, el episodio actual y lo que sigue.
        </p>
      </div>

      <div className='space-y-8'>
        {storyWindow.length > 0 && (
          <div>
            <div className='flex items-center gap-3 mb-6'>
              <h2 className='text-lg sm:text-2xl font-black text-foreground'>
                Tu recorrido
              </h2>
              <span className='px-3 py-1 rounded-[6px] text-xs font-bold uppercase tracking-wide bg-primary text-primary-foreground border-2 border-border shadow-[2px_2px_0_0_var(--color-border)]'>
                {storyWindow.length} episodio{storyWindow.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
              {storyWindow.map((episode) => (
                <EpisodeCard episode={episode} key={`${episode.displaySlot}-${episode.id}`} />
              ))}
            </div>
          </div>
        )}

        {hasFinishedCatalog && (
          <div className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
            <h2 className='text-xl sm:text-2xl font-black text-foreground mb-2'>
              No hay mas episodios por ahora
            </h2>
            <p className='text-muted-foreground font-medium'>
              Ya completaste todas las historias disponibles. Cuando publiquemos un nuevo episodio, aparecera aqui automaticamente.
            </p>
          </div>
        )}

        {!hasAnyEpisodes && (
          <div className='text-center py-12 rounded-[10px] border-2 border-border bg-card shadow-[6px_6px_0_0_var(--color-border)]'>
            <p className='text-lg text-muted-foreground font-semibold'>
              No hay episodios disponibles en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
