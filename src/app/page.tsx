import { getHomeFeaturesAction } from '@/features/home/presentation/actions';
import { FeatureList } from '@/features/home/presentation/components/FeatureList';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { Header } from '@/shared/presentation/components/Header';

export default async function Home() {
  const features = await getHomeFeaturesAction();
  const { currentUser } = await getAuthenticatedAppForUser();
  const serializableUser = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email || null,
        displayName: currentUser.displayName || null,
        photoURL: currentUser.photoURL || null,
      }
    : null;

  return (
    <>
      <Header initialUser={serializableUser} />
      <main className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-8'>
        <div className='max-w-6xl mx-auto py-12'>
          <div className='text-center mb-16'>
            <h1 className='text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight'>
              English Practice App
            </h1>
            <p className='text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
              Choose a mode to start practicing your English skills.
            </p>
          </div>

          <FeatureList features={features} />
        </div>
      </main>
    </>
  );
}
