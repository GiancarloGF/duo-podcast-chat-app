import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { getEpisodeModel } from '@/models/Episode';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const Episode = getEpisodeModel();
    const episode = await Episode.findOne({ id: id }); // Find by the custom 'id' field (e.g., 'ep-1')

    if (!episode) {
      return NextResponse.json({ error: 'Episode not found' }, { status: 404 });
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episode' },
      { status: 500 }
    );
  }
}
