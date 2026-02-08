import type { UserProgressRepository } from '@/features/translations/domain/repositories/UserProgressRepository.interface';
import type { UserProgress } from '@/features/translations/domain/entities/UserProgress';

export async function getAllUserProgress(
  repository: UserProgressRepository,
  userId: string
): Promise<UserProgress[]> {
  return repository.getAllByUserId(userId);
}
