import { ChatContainer } from '@/features/translations/presentation/components/chat-container';
import { getCurrentUserId } from '@/features/auth/presentation/actions';
import { getEpisodeByIdAction } from '@/features/stories/presentation/actions';
import { getUserProgress } from '@/features/translations/presentation/actions';
import { notFound } from 'next/navigation';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userProgressId: string }>;
}) {
  const { userProgressId } = await params;
  const userId = await getCurrentUserId();

  try {
    const userProgress = await getUserProgress(userId, userProgressId);

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
        userId={userId}
      />
    );
  } catch (error) {
    console.error('Error loading chat page:', error);
    throw error;
  }
}
