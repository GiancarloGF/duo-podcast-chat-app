import type { User } from '../entities/User';

export interface AuthRepository {
  getCurrentUser(): Promise<User | null>;
}
