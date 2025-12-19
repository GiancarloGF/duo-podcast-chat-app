import { getChatModel } from '@/models/Chat';
import dbConnect from './conection';

const FAKE_USER_ID = 'fake-user-123';

export async function getChatById(chatId: string) {
  try {
    await dbConnect();
    const Chat = getChatModel();
    const chat = await Chat.findOne({ _id: chatId, userId: FAKE_USER_ID });

    if (!chat) {
      throw new Error('Chat not found: ' + chatId);
    }

    return chat;
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw new Error('Error fetching chat: ' + error);
  }
}
