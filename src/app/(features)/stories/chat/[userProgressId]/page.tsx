import { ChatContainer } from '@/features/stories/presentation/components/chat-container';
import { getEpisodeByIdAction, getUserProgress } from '@/features/stories/presentation/actions';
import { notFound } from 'next/navigation';

export default async function StoriesChatPage({
  params,
}: {
  params: Promise<{ userProgressId: string }>;
}) {
  const { userProgressId } = await params;

  try {
    const userProgress = await getUserProgress(userProgressId);

    if (!userProgress) {
      console.error(`User progress not found for episode: ${userProgressId}`);
      notFound();
    }
    const episode = await getEpisodeByIdAction(userProgress.episodeId);

    if (!episode) {
      console.error(`Episode not found: ${userProgress.episodeId}`);
      notFound();
    }

    return (
      <ChatContainer
        key={userProgressId}
        initialEpisode={episode}
        initialUserProgress={userProgress}
      />
    );
  } catch (error) {
    console.error('Error loading chat page:', error);
    throw error;
  }
}
