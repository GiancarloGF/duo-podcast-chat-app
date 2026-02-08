import { CONSTANTS } from '@/shared/infrastructure/config/constants';
import type { User } from '@/features/auth/domain/entities/User';
import type { AuthRepository } from '@/features/auth/domain/repositories/AuthRepository.interface';

export class StubAuthRepository implements AuthRepository {
  async getCurrentUser(): Promise<User | null> {
    return {
      id: CONSTANTS.FAKE_USER_ID,
      email: undefined,
      name: undefined,
      avatarUrl: undefined,
    };
  }
}
