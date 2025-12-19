import { getChatById } from '@/lib/db/get-chat';
import { getEpisodeById } from '@/lib/db/get-episode';
import { ChatContainer } from '@/components/chat/chat-container';
import { notFound } from 'next/navigation';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  try {
    const chat = await getChatById(chatId);

    if (!chat) {
      // Handle case where chat might not exist (though getChatById throws usually)
      notFound();
    }

    const episode = await getEpisodeById(chat.episodeId);

    if (!episode) {
      console.error(
        `Episode not found for chat ${chatId} (episodeId: ${chat.episodeId})`
      );
      // We might want to show an error or 404
      notFound();
    }

    return (
      <ChatContainer
        initialChat={chat}
        initialEpisode={episode}
        chatId={chatId}
      />
    );
  } catch (error) {
    console.error('Error loading chat page:', error);
    // You could render a specific error component here or let Next.js error boundary handle it
    throw error;
  }
}
