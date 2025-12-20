import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/conection';
import { getEpisodeModel } from '@/lib/db/models/Episode';

export async function GET() {
  try {
    await dbConnect();
    const Episode = getEpisodeModel();
    const episodes = await Episode.find({})
      .select('id number title imageUrl summaryText themes characters messages')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate messageCount for each episode
    const episodesWithCount = episodes.map((ep: any) => ({
      ...ep,
      messageCount: ep.messages?.length || 0,
      messages: [], // Don't send full messages array for list view
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
