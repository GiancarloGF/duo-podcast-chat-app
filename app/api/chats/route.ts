import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getChatModel } from '@/models/Chat';
import { getEpisodeModel } from '@/models/Episode';

const FAKE_USER_ID = 'fake-user-123';

export async function GET() {
  try {
    await dbConnect();
    const Chat = getChatModel();
    // Fetch all chats for the current user with all fields
    const chats = await Chat.find({ userId: FAKE_USER_ID })
      .lean() // Convert to plain JS objects
      .sort({
        updatedAt: -1,
      });
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { episodeId } = body;

    if (!episodeId) {
      return NextResponse.json(
        { error: 'Episode ID is required' },
        { status: 400 }
      );
    }

    await dbConnect();
    const Episode = getEpisodeModel();
    const Chat = getChatModel();

    // Check if the episode exists
    const episode = await Episode.findOne({ id: episodeId });
    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    // Check if chat already exists for this user and episode
    let chat = await Chat.findOne({
      userId: FAKE_USER_ID,
      episodeId: episodeId,
    });

    if (chat) {
      // If it exists, return it (idempotent)
      return NextResponse.json(chat);
    }

    // Create new chat
    chat = await Chat.create({
      userId: FAKE_USER_ID,
      episodeId: episodeId,
      status: 'initialized',
      progress: 0,
      messages: [], // Starts empty
    });

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
