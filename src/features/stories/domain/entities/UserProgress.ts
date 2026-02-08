import type { Interaction } from './Interaction';

export interface UserProgress {
  id?: string;
  userId: string;
  episodeId: string;
  currentMessageIndex: number;
  interactions: Interaction[];
  status: 'started' | 'completed';
  lastActiveAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
