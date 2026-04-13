import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { ChatContainer } from '@/features/stories/presentation/components/chat-container';
import { getStoryChatPageData } from '@/features/stories/server/getStoryChatPageData';
import { createFeatureMetadata } from '@/shared/presentation/metadata/featureMetadata';

export async function generateMetadata(): Promise<Metadata> {
  return createFeatureMetadata({
    title: 'Story Chat',
    description:
      'Continúa tu episodio activo y recibe feedback sobre cada traducción.',
    path: '/stories',
  });
}

export default async function StoriesChatPage({
  params,
}: {
  params: Promise<{ userProgressId: string }>;
}) {
  const { userProgressId } = await params;

  return (
    <Suspense fallback={null}>
      <StoriesChatPageContent userProgressId={userProgressId} />
    </Suspense>
  );
}

interface StoriesChatPageContentProps {
  userProgressId: string;
}

async function StoriesChatPageContent({
  userProgressId,
}: StoriesChatPageContentProps) {
  await connection();
  const { currentEpisode, episode, userProgress } =
    await getStoryChatPageData(userProgressId);

  if (!userProgress) {
    notFound();
  }

  if (!episode) {
    notFound();
  }

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
