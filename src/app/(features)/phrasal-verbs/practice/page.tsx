import { SuperGroupOverview } from '@/features/phrasal-verbs/presentation/components/SuperGroupOverview';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/presentation/components/ui/breadcrumb';

export default function PhrasalVerbsPracticePage() {
  return (
    <main className='min-h-screen p-4'>
      <div className='mx-auto max-w-6xl py-12'>
        <Breadcrumb className='mb-6'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/'>Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href='/phrasal-verbs'>Phrasal verbs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Practica</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className='mb-8 rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
          <h1 className='mb-2 text-4xl font-black text-foreground'>
            Sesion de practica
          </h1>
          <p className='text-lg font-medium text-muted-foreground'>
            Selecciona un supergrupo para comenzar. Esta pantalla aun no tiene funcionalidad activa.
          </p>
        </section>

        <SuperGroupOverview />
      </div>
    </main>
  );
}
