import dbConnect from '@/lib/db/conection';
import { getUserProgressModel } from '@/lib/db/models/UserProgress';
import { UserProgress } from '@/lib/types';

export async function getAllUserProgress(
  userId: string
): Promise<UserProgress[]> {
  try {
    await dbConnect();
    const UserProgressModel = getUserProgressModel();
    // The dashboard will pass the userId (or we use the fake one for now).
    // The prompt implies we fetch "all UserProgress of the user".

    // We will assume the caller passes userId.

    const progressDocs = await UserProgressModel.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const sanitizedProgress = progressDocs.map(
      (doc) =>
        ({
          id: doc._id.toString(),
          userId: doc.userId,
          episodeId: doc.episodeId.toString(),
          currentMessageIndex: doc.currentMessageIndex,
          interactions: doc.interactions,
          status: doc.status,
          lastActiveAt: doc.lastActiveAt,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        } as UserProgress)
    );

    return sanitizedProgress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
}
