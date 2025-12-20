import dbConnect from '@/lib/db/conection';
import { getUserProgressModel } from '@/lib/db/models/UserProgress';
import { UserProgress } from '@/lib/types';
import { Types } from 'mongoose';

export async function getUserProgress(
  userId: string,
  userProgressId: string
): Promise<UserProgress | null> {
  try {
    await dbConnect();
    const UserProgressModel = getUserProgressModel();

    const userProgressDoc = await UserProgressModel.findOne({
      userId,
      _id: new Types.ObjectId(userProgressId),
    }).lean();

    // We need to shape it to UserProgress interface
    let userProgress = null;

    if (userProgressDoc) {
      // Remove _id and ensure serialization
      const { _id, ...rest } = userProgressDoc;

      const plainUserProgress = {
        ...rest,
        id: _id.toString(),
        userId: userProgressDoc.userId,
        episodeId: userProgressDoc.episodeId.toString(),
        interactions: userProgressDoc.interactions.map((i: any) => ({
          ...i,
          timestamp: i.timestamp ? new Date(i.timestamp) : new Date(),
        })),
      };

      // Sanitize for Client Component (removes _id if nested, converts Dates to strings)
      userProgress = JSON.parse(
        JSON.stringify(plainUserProgress)
      ) as UserProgress;
    }

    return userProgress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}
