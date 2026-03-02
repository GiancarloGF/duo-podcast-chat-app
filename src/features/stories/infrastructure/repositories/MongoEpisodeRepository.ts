import mongoose from 'mongoose';
import type { Episode } from '@/features/stories/domain/entities/Episode';
import type { EpisodeRepository } from '@/features/stories/domain/repositories/EpisodeRepository.interface';
import { mapDocToEpisodeList, mapDocToEpisodeFull } from '@/features/stories/infrastructure/mappers/EpisodeMapper';
import dbConnect from '@/shared/infrastructure/database/mongo/connection';
import { getEpisodeModel } from '@/shared/infrastructure/database/mongo/models/Episode';

export class MongoEpisodeRepository implements EpisodeRepository {
  async getStories(): Promise<Episode[]> {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    const episodes = await EpisodeModel.aggregate([
      {
        $project: {
          _id: 1,
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
      { $sort: { number: 1, createdAt: 1 } },
    ]);
    return episodes.map((e: Record<string, unknown>) => mapDocToEpisodeList(e));
  }

  async getByNumbers(numbers: number[]): Promise<Episode[]> {
    if (numbers.length === 0) {
      return [];
    }

    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    const uniqueNumbers = [...new Set(numbers)];
    const episodes = await EpisodeModel.aggregate([
      {
        $match: {
          number: { $in: uniqueNumbers },
        },
      },
      {
        $project: {
          _id: 1,
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
      { $sort: { number: 1, createdAt: 1 } },
    ]);

    return episodes.map((e: Record<string, unknown>) => mapDocToEpisodeList(e));
  }

  async getMaxEpisodeNumber(): Promise<number | null> {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    const episode = await EpisodeModel.findOne({}, { number: 1 })
      .sort({ number: -1 })
      .lean();

    return episode?.number ?? null;
  }

  async getEpisodeNumberById(id: string): Promise<number | null> {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    let episode = await EpisodeModel.findOne({ id }, { number: 1 }).lean();
    if (!episode && /^[a-fA-F0-9]{24}$/.test(id)) {
      episode = await EpisodeModel.findOne(
        { _id: new mongoose.Types.ObjectId(id) },
        { number: 1 }
      ).lean();
    }

    return episode?.number ?? null;
  }

  async getNumbersByIds(ids: string[]): Promise<Array<{ id: string; number: number }>> {
    if (ids.length === 0) {
      return [];
    }

    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    const objectIds = ids
      .filter((id) => /^[a-fA-F0-9]{24}$/.test(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const episodes = await EpisodeModel.find(
      {
        $or: [
          { id: { $in: ids } },
          ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
        ],
      },
      { id: 1, number: 1 }
    ).lean();

    return episodes.map((episode) => ({
      id:
        (episode._id as { toString: () => string })?.toString?.() ??
        String(episode.id),
      number: episode.number as number,
    }));
  }

  async getEpisodeById(id: string): Promise<Episode | null> {
    await dbConnect();
    const EpisodeModel = getEpisodeModel();
    let episode = await EpisodeModel.findOne({ id }).lean();
    if (!episode && /^[a-fA-F0-9]{24}$/.test(id)) {
      episode = await EpisodeModel.findOne({
        _id: new mongoose.Types.ObjectId(id),
      }).lean();
    }
    if (!episode) return null;
    const doc = episode as unknown as Record<string, unknown>;
    return mapDocToEpisodeFull(doc, doc);
  }
}
