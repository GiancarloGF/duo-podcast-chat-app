import { NextResponse } from 'next/server';
import dbConnect from '@/shared/infrastructure/database/mongo/connection';
import { getEpisodeModel } from '@/shared/infrastructure/database/mongo/models/Episode';

export async function GET() {
  try {
    await dbConnect();
    const Episode = getEpisodeModel();
    const episodes = await Episode.find({})
      .select('id number title imageUrl summaryText themes characters messages')
      .sort({ createdAt: -1 })
      .lean();

    const episodesWithCount = episodes.map((ep: Record<string, unknown>) => ({
      ...ep,
      messageCount: (ep.messages as unknown[])?.length || 0,
      messages: [],
    }));

    return NextResponse.json(episodesWithCount);
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
