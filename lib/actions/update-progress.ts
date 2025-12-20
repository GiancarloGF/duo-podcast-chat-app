'use server';

import dbConnect from '@/lib/db/conection';
import { getUserProgressModel } from '@/lib/db/models/UserProgress';
import { Interaction } from '@/lib/types';
import { Types } from 'mongoose';

interface UpdateProgressResult {
  success: boolean;
  message?: string;
  newIndex?: number;
  // streakUpdated?: boolean; // Future gamification
}

export async function updateProgress(
  userId: string,
  episodeId: string,
  newIndex: number,
  status: 'started' | 'completed' = 'started',
  interaction?: Interaction
): Promise<UpdateProgressResult> {
  try {
    await dbConnect();
    const UserProgress = getUserProgressModel();
    const now = new Date();

    const updateQuery: any = {
      $set: {
        currentMessageIndex: newIndex,
        lastActiveAt: now,
        status: status,
      },
    };

    // If there's an interaction to record (e.g. from a translation)
    if (interaction) {
      updateQuery.$push = {
        interactions: interaction,
      };
    }

    const updatedProgress = await UserProgress.findOneAndUpdate(
      { userId, episodeId: new Types.ObjectId(episodeId) },
      updateQuery,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return {
      success: true,
      newIndex: updatedProgress.currentMessageIndex,
    };
  } catch (error) {
    console.error('Error updating progress:', error);
    return { success: false, message: 'Error saving progress' };
  }
}
