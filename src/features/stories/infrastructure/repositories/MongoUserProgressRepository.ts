import { Types } from 'mongoose';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';
import type { Interaction } from '@/features/stories/domain/entities/Interaction';
import type { UserProgressRepository } from '@/features/stories/domain/repositories/UserProgressRepository.interface';
import dbConnect from '@/shared/infrastructure/database/mongo/connection';
import { getUserProgressModel } from '@/shared/infrastructure/database/mongo/models/UserProgress';

function mapDocToUserProgress(doc: Record<string, unknown>): UserProgress {
  const interactions = ((doc.interactions as unknown[]) || []).map(
    (i: Record<string, unknown>) => ({
      messageId: i.messageId as string,
      userInput: (i.userInput as string) || '',
      translationFeedback: i.translationFeedback as UserProgress['interactions'][0]['translationFeedback'],
      isCorrect: (i.isCorrect as boolean) ?? false,
      timestamp: i.timestamp ? new Date(i.timestamp as string) : new Date(),
    })
  );
  return {
    id: (doc._id as { toString: () => string }).toString(),
    userId: doc.userId as string,
    episodeId: (doc.episodeId as { toString: () => string }).toString(),
    currentMessageIndex: (doc.currentMessageIndex as number) ?? 0,
    interactions,
    status: (doc.status as 'started' | 'completed') ?? 'started',
    lastActiveAt: doc.lastActiveAt
      ? new Date(doc.lastActiveAt as string)
      : new Date(),
    createdAt: doc.createdAt ? new Date(doc.createdAt as string) : undefined,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt as string) : undefined,
  };
}

export class MongoUserProgressRepository implements UserProgressRepository {
  async getById(progressId: string): Promise<UserProgress | null> {
    await dbConnect();
    const Model = getUserProgressModel();
    const doc = await Model.findOne({
      _id: new Types.ObjectId(progressId),
    }).lean();
    if (!doc) return null;
    return mapDocToUserProgress(doc as unknown as Record<string, unknown>);
  }

  async getByUserAndEpisode(
    userId: string,
    episodeId: string
  ): Promise<UserProgress | null> {
    await dbConnect();
    const Model = getUserProgressModel();
    let doc = await Model.findOne({ userId, episodeId }).lean();
    if (!doc && /^[a-fA-F0-9]{24}$/.test(episodeId)) {
      doc = await Model.findOne({
        userId,
        episodeId: new Types.ObjectId(episodeId),
      }).lean();
    }
    if (!doc) return null;
    return mapDocToUserProgress(doc as unknown as Record<string, unknown>);
  }

  async getAllByUserId(userId: string): Promise<UserProgress[]> {
    await dbConnect();
    const Model = getUserProgressModel();
    const docs = await Model.find({ userId }).lean();
    return docs.map((d) =>
      mapDocToUserProgress(d as unknown as Record<string, unknown>)
    );
  }

  async create(data: {
    userId: string;
    episodeId: string;
    currentMessageIndex: number;
    status: 'started' | 'completed';
    interactions: Interaction[];
    lastActiveAt: Date;
  }): Promise<UserProgress> {
    await dbConnect();
    const Model = getUserProgressModel();
    const doc = await Model.create({
      userId: data.userId,
      episodeId: new Types.ObjectId(data.episodeId),
      currentMessageIndex: data.currentMessageIndex,
      status: data.status,
      interactions: data.interactions,
      lastActiveAt: data.lastActiveAt,
    });
    return mapDocToUserProgress(doc.toObject() as unknown as Record<string, unknown>);
  }

  async update(
    userId: string,
    episodeId: string,
    update: {
      currentMessageIndex?: number;
      status?: 'started' | 'completed';
      lastActiveAt?: Date;
      interaction?: Interaction;
    }
  ): Promise<UserProgress | null> {
    await dbConnect();
    const Model = getUserProgressModel();
    const episodeIdQuery =
      episodeId.length === 24 && /^[a-fA-F0-9]{24}$/.test(episodeId)
        ? new Types.ObjectId(episodeId)
        : episodeId;
    const updateQuery: Record<string, unknown> = {
      $set: {
        ...(update.currentMessageIndex !== undefined && {
          currentMessageIndex: update.currentMessageIndex,
        }),
        ...(update.status && { status: update.status }),
        ...(update.lastActiveAt && { lastActiveAt: update.lastActiveAt }),
      },
    };
    if (update.interaction) {
      (updateQuery as { $push?: { interactions: Interaction } }).$push = {
        interactions: update.interaction,
      };
    }
    const doc = await Model.findOneAndUpdate(
      { userId, episodeId: episodeIdQuery },
      updateQuery,
      { new: true }
    ).lean();
    if (!doc) return null;
    return mapDocToUserProgress(doc as unknown as Record<string, unknown>);
  }
}
