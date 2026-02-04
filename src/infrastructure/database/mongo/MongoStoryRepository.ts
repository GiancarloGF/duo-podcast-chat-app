import { Story } from '@/src/core/entities/Story';
import { IStoryRepository } from '@/src/core/repositories/IStoryRepository';
import dbConnect from '@/lib/db/conection';
import { getEpisodeModel } from '@/lib/db/models/Episode';

export class MongoStoryRepository implements IStoryRepository {
  async getStories(): Promise<Story[]> {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();

    // Use aggregation to count messages without loading them
    const episodes = await EpisodeModel.aggregate([
      {
        $project: {
          _id: 1, // keep _id as it's needed for id mapping usually, but schema has custom id field?
          id: 1,
          slug: 1,
          number: 1,
          title: 1,
          url: 1,
          imageUrl: 1,
          summaryText: 1,
          summaryHtml: 1,
          languageLevel: 1,
          themes: 1,
          characters: 1,
          createdAt: 1,
          updatedAt: 1,
          messageCount: { $size: { $ifNull: ['$messages', []] } },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return episodes.map((e) => this.mapToEntity(e));
  }

  async getStoryById(id: string): Promise<Story | null> {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    const episode = await EpisodeModel.findOne({ id }).lean();
    return episode ? this.mapToEntity(episode) : null;
  }

  private mapToEntity(doc: any): Story {
    return {
      id: doc.id || doc._id.toString(),
      slug: doc.slug,
      number: doc.number,
      title: doc.title,
      url: doc.url,
      imageUrl: doc.imageUrl,
      summaryText: doc.summaryText,
      summaryHtml: doc.summaryHtml,
      languageLevel: doc.languageLevel,
      themes: doc.themes || [],
      characters: doc.characters || [],
      messages: doc.messages || [],
      messageCount:
        doc.messageCount !== undefined
          ? doc.messageCount
          : doc.messages
            ? doc.messages.length
            : 0,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
    };
  }
}
