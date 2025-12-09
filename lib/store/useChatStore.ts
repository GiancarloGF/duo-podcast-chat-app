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
  loadEpisodeDetails: (episodeId: string) => Promise<Episode | null>;
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
        const fetchFull = options?.full;
        set({ isLoading: true, error: null });
        try {
          if (fetchFull) {
            const epsRes = await fetch('/api/episodes');
            const episodes = await epsRes.json();
            const chatsRes = await fetch('/api/chats');
            const chats = await chatsRes.json();
            set({ episodes, chats, isLoading: false });
            return;
          }

          const query = `
            query HomeSummary {
              homeSummary {
                episodes {
                  id
                  title
                  imageUrl
                  summaryText
                  summaryHtml
                  languageLevel
                  themes
                  messageCount
                  characters {
                    name
                    role
                  }
                }
                chats {
                  id
                  episodeId
                  userId
                  status
                  progress
                }
              }
            }
          `;

          const res = await fetch('/api/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
          });

          const { data, errors } = await res.json();

          if (errors?.length) {
            throw new Error(errors[0]?.message || 'GraphQL error');
          }

          const homeSummary = data?.homeSummary;
          const episodes: Episode[] = (homeSummary?.episodes || []).map(
            (episode: any) => ({
              ...episode,
              messages: [],
            })
          );

          const chats: Chat[] = (homeSummary?.chats || []).map(
            (chat: any) => ({
              ...chat,
              _id: chat.id || chat._id,
              messages: chat.messages || [],
            })
          );

          set({ episodes, chats, isLoading: false });
        } catch (error) {
          console.error('Failed to load data:', error);
          set({ error: 'Failed to load data', isLoading: false });
        }
      },

      loadEpisodeDetails: async (episodeId: string) => {
        try {
          const res = await fetch(`/api/episodes/${episodeId}`);
          if (!res.ok) throw new Error('Failed to load episode');
          const episode: Episode = await res.json();

          set((state) => {
            const existingIndex = state.episodes.findIndex(
              (e) => e.id === episodeId
            );
            if (existingIndex >= 0) {
              const updated = [...state.episodes];
              updated[existingIndex] = episode;
              return { episodes: updated };
            }
            return { episodes: [...state.episodes, episode] };
          });

          return episode;
        } catch (error) {
          console.error('Failed to load episode details:', error);
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
