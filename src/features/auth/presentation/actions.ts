'use server';

import { getCurrentUser } from '@/features/auth/application/usecases/GetCurrentUser.usecase';
import { StubAuthRepository } from '@/features/auth/infrastructure/repositories/StubAuthRepository';

const authRepo = new StubAuthRepository();

export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser(authRepo);
  return user?.id ?? '';
}
