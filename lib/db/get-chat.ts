import { getChatModel } from '@/models/Chat';
import dbConnect from './conection';
import { Chat } from '@/lib/types';

const FAKE_USER_ID = 'fake-user-123';

export async function getChatById(chatId: string): Promise<Chat> {
  try {
    await dbConnect();
    const ChatModel = getChatModel();
    const chat = await ChatModel.findOne({
      _id: chatId,
      userId: FAKE_USER_ID,
    }).lean();

    if (!chat) {
      throw new Error('Chat not found: ' + chatId);
    }

    // Convert _id to string for serialization
    const chatData = {
      ...chat,
      _id: chat._id.toString(),
      episodeId: chat.episodeId.toString(),
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        _id: msg._id ? msg._id.toString() : undefined,
      })),
    };

    return chatData as unknown as Chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw new Error('Error fetching chat: ' + error);
  }
}
