import { redirect } from 'next/navigation';
import { LoginScreen } from '@/features/auth/presentation/components/LoginScreen';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// Only allow internal redirects after login. Any external or malformed value
// falls back to the homepage.
function getNextPath(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' && value[0].startsWith('/') ? value[0] : '/';
  }

  if (typeof value === 'string' && value.startsWith('/')) {
    return value;
  }

  return '/';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { currentUser } = await getAuthenticatedAppForUser();
  const resolvedSearchParams = await searchParams;

  if (currentUser) {
    // Authenticated users should never stay on the login screen.
    redirect('/');
  }

  return <LoginScreen nextPath={getNextPath(resolvedSearchParams.next)} />;
}
