// import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
// import { Chat, ChatMessage } from '../types';

// interface ChatState {
//   chats: Chat[]; // Only initialized chats from DB

//   // Actions
//   updateLocalChatProgress: (
//     chatId: string,
//     progress: number,
//     messages: ChatMessage[],
//     status?: Chat['status']
//   ) => void;
//   syncChatToDB: (chatId: string, data: Partial<Chat>) => Promise<void>;
// }

// export const useChatStore = create<ChatState>()(
//   persist(
//     (set, get) => ({
//       chats: [],

//       updateLocalChatProgress: (
//         chatId: string,
//         progress: number,
//         messages: ChatMessage[],
//         status?: Chat['status']
//       ) => {
//         set((state) => {
//           // We need to handle the case where the chat might not exist in the local store yet
//           // (since we are not loading all chats initially anymore).
//           // If it doesn't exist, we can't update it.
//           // But ChatContainer calls this.
//           // If the store is empty, this does nothing useful except maybe validation?
//           // Actually, if we want offline persistence, we should probably add it if missing?
//           // For now, let's keep the existing logic: iterate and update if found.
//           // BUT, if we loaded the chat via SSR, it's NOT in the store initially.
//           // So `state.chats` will be empty or stale.

//           // Ideally, we should have a `setChat` action to initialize it from SSR data.
//           // However, the user asked to CLEANUP, not add new features.
//           // Given the current code in ChatContainer, it sends updates.
//           // If we don't fix the hydration (adding SSR chat to store), this store is useless for that specific chat.

//           // But I will stick to the user request: remove unused.
//           // I will keep the logic as is.

//           return {
//             chats: state.chats.map((c) =>
//               (c as any)._id === chatId || (c as any).id === chatId
//                 ? { ...c, progress, messages, ...(status && { status }) }
//                 : c
//             ),
//           };
//         });
//       },

//       syncChatToDB: async (chatId: string, data: Partial<Chat>) => {
//         try {
//           const res = await fetch(`/api/chats/${chatId}`, {
//             method: 'PATCH',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(data),
//           });

//           if (!res.ok) {
//             throw new Error('Failed to sync chat to DB');
//           }

//           const updatedChat = await res.json();

//           // Update the local store with the DB response
//           set((state) => ({
//             chats: state.chats.map((c) =>
//               (c._id || c.id) === chatId ? updatedChat : c
//             ),
//           }));
//         } catch (error) {
//           console.error('Error syncing chat to DB:', error);
//         }
//       },
//     }),
//     {
//       name: 'podcast-chat-storage',
//       partialize: (state) => ({ chats: state.chats }),
//     }
//   )
// );
