import type { UserProgressRepository } from '@/features/translations/domain/repositories/UserProgressRepository.interface';
import type { UserProgress } from '@/features/translations/domain/entities/UserProgress';

export async function getUserProgress(
  repository: UserProgressRepository,
  userId: string,
  userProgressId: string
): Promise<UserProgress | null> {
  const progress = await repository.getById(userProgressId);
  if (!progress || progress.userId !== userId) return null;
  return progress;
}
