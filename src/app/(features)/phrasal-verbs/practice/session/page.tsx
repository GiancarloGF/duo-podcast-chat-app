import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/presentation/components/ui/breadcrumb';
import { PracticeSessionRunner } from '@/features/phrasal-verbs/presentation/components/PracticeSessionRunner';

interface SessionPageProps {
  searchParams: Promise<{
    superGroup?: string;
    group?: string;
    category?: string | string[];
  }>;
}

export default async function PhrasalVerbsPracticeSessionPage({
  searchParams,
}: SessionPageProps) {
  const params = await searchParams;
  const categories = Array.from(
    new Set(
      (typeof params.category === 'string'
        ? [params.category]
        : Array.isArray(params.category)
          ? params.category
          : [])
        .map((category) => category.trim())
        .filter(Boolean)
    )
  );

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
              <BreadcrumbLink href='/phrasal-verbs/practice'>Practica</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sesion</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className='mb-8 rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
          <h1 className='mb-2 text-4xl font-black text-foreground'>Practice session</h1>
          <p className='text-lg font-medium text-muted-foreground'>
            Complete each exercise, validate your answers, and continue with a
            new set of phrasal verbs.
          </p>
        </section>

        <PracticeSessionRunner
          superGroup={params.superGroup ?? null}
          group={params.group ?? null}
          categories={categories}
        />
      </div>
    </main>
  );
}
