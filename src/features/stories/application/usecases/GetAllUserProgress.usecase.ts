import type { UserProgressRepository } from '@/features/stories/domain/repositories/UserProgressRepository.interface';
import type { UserProgress } from '@/features/stories/domain/entities/UserProgress';

export async function getAllUserProgress(
  repository: UserProgressRepository,
  userId: string
): Promise<UserProgress[]> {
  return repository.getAllByUserId(userId);
}
