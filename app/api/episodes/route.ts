import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getEpisodeModel } from '@/models/Episode';

export async function GET() {
  try {
    await dbConnect();
    const Episode = getEpisodeModel();
    const episodes = await Episode.find({}).sort({ createdAt: -1 }); // Or sort by some order field
    return NextResponse.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch episodes',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
