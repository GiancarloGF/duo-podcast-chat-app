import type { UserProgressRepository } from '@/features/stories/domain/repositories/UserProgressRepository.interface';
import type { Interaction } from '@/features/stories/domain/entities/Interaction';

export interface UpdateProgressResult {
  success: boolean;
  message?: string;
  newIndex?: number;
}

export async function updateProgress(
  repository: UserProgressRepository,
  userId: string,
  episodeId: string,
  newIndex: number,
  status: 'started' | 'completed' = 'started',
  interaction?: Interaction
): Promise<UpdateProgressResult> {
  try {
    const updated = await repository.update(userId, episodeId, {
      currentMessageIndex: newIndex,
      status,
      lastActiveAt: new Date(),
      ...(interaction && { interaction }),
    });
    if (!updated) {
      return { success: false, message: 'Error saving progress' };
    }
    return { success: true, newIndex: updated.currentMessageIndex };
  } catch (error) {
    console.error('Error updating progress:', error);
    return { success: false, message: 'Error saving progress' };
  }
}
