import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Episode, Chat, ChatMessage } from '../types';

interface ChatState {
  episodes: Episode[];
  chats: Chat[]; // Only initialized chats from DB
  isLoading: boolean;
  error: string | null;

  // Actions
  loadData: () => Promise<void>;
  initializeChat: (episodeId: string) => Promise<Chat | null>;
  getChatByEpisodeId: (episodeId: string) => Chat | undefined;
  updateLocalChatProgress: (
    chatId: string,
    progress: number,
    messages: ChatMessage[]
  ) => void;
  syncChatToDB: (chatId: string, data: Partial<Chat>) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      episodes: [],
      chats: [],
      isLoading: false,
      error: null,

      loadData: async () => {
        set({ isLoading: true, error: null });
        try {
          // Fetch Episodes
          const epsRes = await fetch('/api/episodes');
          const episodes = await epsRes.json();
          // Fetch Chats
          const chatsRes = await fetch('/api/chats');
          const chats = await chatsRes.json();
          set({ episodes, chats, isLoading: false });
        } catch (error) {
          console.error('Failed to load data:', error);
          set({ error: 'Failed to load data', isLoading: false });
        }
      },

      initializeChat: async (episodeId: string) => {
        try {
          const res = await fetch('/api/chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodeId }),
          });

          if (!res.ok) throw new Error('Failed to create chat');

          const newChat: Chat = await res.json();

          set((state) => {
            // Avoid duplicates
            const exists = state.chats.find((c) => c.episodeId === episodeId);
            if (exists) return state;
            return { chats: [...state.chats, newChat] };
          });

          return newChat;
        } catch (error) {
          console.error('Error initializing chat:', error);
          return null;
        }
      },

      getChatByEpisodeId: (episodeId: string) => {
        return get().chats.find((c) => c.episodeId === episodeId);
      },

      updateLocalChatProgress: (
        chatId: string,
        progress: number,
        messages: ChatMessage[]
      ) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            // Check both _id and client-side id if needed, but DB _id is safest
            (c as any)._id === chatId ? { ...c, progress, messages } : c
          ),
        }));
      },

      syncChatToDB: async (chatId: string, data: Partial<Chat>) => {
        try {
          await fetch(`/api/chats/${chatId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } catch (error) {
          console.error('Error syncing chat to DB:', error);
        }
      },
    }),
    {
      name: 'podcast-chat-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ chats: state.chats, episodes: state.episodes }), // Persist minimal data
    }
  )
);
