'use server';

import { getCurrentUser } from '@/features/auth/application/usecases/GetCurrentUser.usecase';
import { FirebaseAuthRepository } from '@/features/auth/infrastructure/repositories/FirebaseAuthRepository';

const authRepo = new FirebaseAuthRepository();

export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser(authRepo);
  return user?.id ?? '';
}
