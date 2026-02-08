import type { UserProgress } from '../entities/UserProgress';
import type { Interaction } from '../entities/Interaction';

export interface UserProgressRepository {
  getById(progressId: string): Promise<UserProgress | null>;
  getByUserAndEpisode(userId: string, episodeId: string): Promise<UserProgress | null>;
  getAllByUserId(userId: string): Promise<UserProgress[]>;
  create(data: {
    userId: string;
    episodeId: string;
    currentMessageIndex: number;
    status: 'started' | 'completed';
    interactions: Interaction[];
    lastActiveAt: Date;
  }): Promise<UserProgress>;
  update(
    userId: string,
    episodeId: string,
    update: {
      currentMessageIndex?: number;
      status?: 'started' | 'completed';
      lastActiveAt?: Date;
      interaction?: Interaction;
    }
  ): Promise<UserProgress | null>;
}
