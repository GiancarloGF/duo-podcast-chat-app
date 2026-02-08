import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import type { User } from '@/features/auth/domain/entities/User';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository.interface';

export class FirebaseAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<User | null> {
    const { currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser) {
      return null;
    }

    return {
      id: currentUser.uid,
      email: currentUser.email || undefined,
      name: currentUser.displayName || undefined,
      avatarUrl: currentUser.photoURL || undefined,
    };
  }
}
