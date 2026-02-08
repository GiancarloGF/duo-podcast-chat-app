import { redirect } from 'next/navigation';
import { LoginScreen } from '@/features/auth/presentation/components/LoginScreen';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';

export default async function LoginPage() {
  const { currentUser } = await getAuthenticatedAppForUser();

  if (currentUser) {
    redirect('/');
  }

  return <LoginScreen />;
}
