import { ChatContainer } from '@/components/chat/chat-container';
import { CONSTANTS } from '@/constants';
import { getEpisodeById } from '@/lib/actions/get-episode';
import { getUserProgress } from '@/lib/actions/get-user-progress';
import { notFound } from 'next/navigation';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ userProgressId: string }>;
}) {
  const { userProgressId } = await params;

  try {
    const userProgress = await getUserProgress(
      CONSTANTS.FAKE_USER_ID,
      userProgressId
    );

    if (!userProgress) {
      console.error(`User progress not found for episode: ${userProgressId}`);
      notFound();
    }
    // 1. Fetch Episode
    const episode = await getEpisodeById(userProgress.episodeId);

    if (!episode) {
      console.error(`Episode not found: ${userProgress.episodeId}`);
      notFound();
    }

    return (
      <ChatContainer
        key={userProgressId}
        initialEpisode={episode}
        initialUserProgress={userProgress}
        userId={CONSTANTS.FAKE_USER_ID}
      />
    );
  } catch (error) {
    console.error('Error loading chat page:', error);
    throw error;
  }
}
