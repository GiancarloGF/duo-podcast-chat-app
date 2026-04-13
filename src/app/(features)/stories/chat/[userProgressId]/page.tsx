import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { ChatContainer } from '@/features/stories/presentation/components/chat-container';
import {
  getEpisodeByIdAction,
  getStorySequenceWindowAction,
  getUserProgress,
} from '@/features/stories/presentation/actions';
import { createFeatureMetadata } from '@/shared/presentation/metadata/featureMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return createFeatureMetadata({
    title: 'Story Chat',
    description: 'Continúa tu episodio activo y recibe feedback sobre cada traducción.',
    path: '/stories',
  });
}

export default async function StoriesChatPage({
  params,
}: {
  params: Promise<{ userProgressId: string }>;
}) {
  const { userProgressId } = await params;
  const userProgress = await getUserProgress(userProgressId);

  if (!userProgress) {
    notFound();
  }

  const episode = await getEpisodeByIdAction(userProgress.episodeId);

  if (!episode) {
    notFound();
  }

  const { currentEpisode } = await getStorySequenceWindowAction();

  if (
    userProgress.status === 'started' &&
    currentEpisode &&
    currentEpisode.id !== episode.id
  ) {
    redirect('/stories');
  }

  return (
    <ChatContainer
      key={userProgressId}
      initialEpisode={episode}
      initialUserProgress={userProgress}
    />
  );
}
