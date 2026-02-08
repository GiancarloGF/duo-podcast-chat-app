import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository.interface';
import type { User } from '@/features/auth/domain/entities/User';

export async function getCurrentUser(
  repository: AuthRepository
): Promise<User | null> {
  return repository.getCurrentUser();
}
