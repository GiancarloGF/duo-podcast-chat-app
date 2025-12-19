import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/conection';
import { getChatModel } from '@/models/Chat';

const FAKE_USER_ID = 'fake-user-123';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    await dbConnect();
    const Chat = getChatModel();
    const chat = await Chat.findOne({ _id: chatId, userId: FAKE_USER_ID });

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const body = await request.json();

    await dbConnect();
    const Chat = getChatModel();

    const updatedChat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: FAKE_USER_ID },
      { $set: body },
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}
