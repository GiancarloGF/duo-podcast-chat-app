import Link from 'next/link';
import { PhrasalVerbsExplorer } from '@/features/phrasal-verbs/presentation/components/PhrasalVerbsExplorer';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { Header } from '@/shared/presentation/components/Header';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/presentation/components/ui/breadcrumb';
import { Button } from '@/shared/presentation/components/ui/button';

export default async function PhrasalVerbsPage() {
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
      <main className='min-h-screen'>
        <div className='mx-auto max-w-6xl py-8'>
          <Breadcrumb className='mb-4'>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Inicio</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Phrasal verbs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className='mb-5 rounded-[10px] border-2 border-border bg-card p-4 shadow-[8px_8px_0_0_var(--color-border)]'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
              <div>
                <h1 className='mb-1 text-3xl font-black text-foreground'>
                  Phrasal Verbs Practice
                </h1>
                <p className='text-base font-medium text-muted-foreground'>
                  Entrena tu ingles con phrasal verbs reales y ejemplos nativos.
                </p>
              </div>
              <Button asChild className='shrink-0'>
                <Link href='/phrasal-verbs/practice'>Iniciar practica</Link>
              </Button>
            </div>
          </section>

          <PhrasalVerbsExplorer />
        </div>
      </main>
    </>
  );
}
