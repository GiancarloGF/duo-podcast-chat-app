import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Episode, Chat, ChatMessage } from '../types';

interface ChatState {
  episodes: Episode[];
  chats: Chat[]; // Only initialized chats from DB
  isLoading: boolean;
  error: string | null;

  // Actions
  loadData: (options?: { full?: boolean }) => Promise<void>;
  loadChatById: (chatId: string) => Promise<Chat | null>;
  loadEpisodeById: (episodeId: string) => Promise<Episode | null>;
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

      loadData: async (options?: { full?: boolean }) => {
        set({ isLoading: true, error: null });
        try {
          // Fetch episodes summary
          const epsRes = await fetch('/api/episodes');
          if (!epsRes.ok) throw new Error('Failed to fetch episodes');
          const episodesData = await epsRes.json();

          const episodes: Episode[] = episodesData.map((episode: any) => ({
            ...episode,
            // Ensure messages is initialized if missing (summary view)
            messages: episode.messages || [],
          }));

          // Fetch user chats summary
          const chatsRes = await fetch('/api/chats');
          if (!chatsRes.ok) throw new Error('Failed to fetch chats');
          const chatsData = await chatsRes.json();

          const chats: Chat[] = chatsData.map((chat: any) => ({
            ...chat,
            _id: chat._id || chat.id,
            messages: chat.messages || [],
          }));

          set({ episodes, chats, isLoading: false });
        } catch (error) {
          console.error('Failed to load data:', error);
          set({ error: 'Failed to load data', isLoading: false });
        }
      },

      loadChatById: async (chatId: string) => {
        try {
          const res = await fetch(`/api/chats/${chatId}`);
          if (!res.ok) throw new Error('Failed to load chat');
          const chat: Chat = await res.json();

          // Ensure timestamp conversion if needed
          const formattedChat = {
            ...chat,
            messages: (chat.messages || []).map((msg: any) => ({
              ...msg,
              timestamp:
                typeof msg.timestamp === 'string'
                  ? new Date(msg.timestamp).getTime()
                  : msg.timestamp,
            })),
          };

          set((state) => {
            const existingIndex = state.chats.findIndex(
              (c) => (c._id || c.id) === chatId
            );
            const updatedChats = [...state.chats];
            if (existingIndex >= 0) {
              updatedChats[existingIndex] = formattedChat;
            } else {
              updatedChats.push(formattedChat);
            }
            return { chats: updatedChats };
          });

          return formattedChat;
        } catch (error) {
          console.error('Error loading chat:', error);
          return null;
        }
      },

      loadEpisodeById: async (episodeId: string) => {
        try {
          const res = await fetch(`/api/episodes/${episodeId}`);
          if (!res.ok) throw new Error('Failed to load episode');
          const episode: Episode = await res.json();

          set((state) => {
            const existingIndex = state.episodes.findIndex(
              (e) => e.id === episodeId
            );
            const updatedEpisodes = [...state.episodes];
            if (existingIndex >= 0) {
              updatedEpisodes[existingIndex] = episode;
            } else {
              updatedEpisodes.push(episode);
            }
            return { episodes: updatedEpisodes };
          });

          return episode;
        } catch (error) {
          console.error('Error loading episode:', error);
          return null;
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
