import { PracticeCategorySelector } from '@/features/phrasal-verbs/presentation/components/PracticeCategorySelector';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/presentation/components/ui/breadcrumb';

export default async function PhrasalVerbsPracticePage() {
  return (
    <div className='py-4'>
      <Breadcrumb className='mb-6'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/'>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href='/phrasal-verbs'>Phrasal verbs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Practice</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className='mb-8 rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
        <h1 className='mb-2 text-xl sm:text-4xl font-black text-foreground'>
          Practice session
        </h1>
        <p className='text-sm sm:text-lg font-medium text-muted-foreground'>
          Select a supergroup, group and category to start your practice
          session.
        </p>
      </section>

      <PracticeCategorySelector />
    </div>
  );
}
