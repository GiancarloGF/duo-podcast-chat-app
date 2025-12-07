import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getChatModel } from '@/models/Chat';

const FAKE_USER_ID = 'fake-user-123';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> } // Match folder name [chatId]
) {
  try {
    const { chatId } = await params;
    const body = await request.json();

    // Fields allowed to update
    const { progress, status, messages } = body;

    await dbConnect();
    const Chat = getChatModel();

    // Verify ownership
    const chat = await Chat.findOne({ _id: chatId, userId: FAKE_USER_ID });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Update fields if provided
    if (typeof progress === 'number') chat.progress = progress;
    if (status) chat.status = status;
    if (messages) chat.messages = messages;

    await chat.save();

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}
