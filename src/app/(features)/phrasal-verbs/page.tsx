import Link from 'next/link';
import { PhrasalVerbsExplorer } from '@/features/phrasal-verbs/presentation/components/PhrasalVerbsExplorer';
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
  return (
    <div className='py-2 sm:py-6'>
      <Breadcrumb className='mb-2'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/'>Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Phrasal verbs</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className='mb-5 rounded-[10px] border-2 border-border bg-card p-4 shadow-[8px_8px_0_0_var(--color-border)]'>
        <div className='flex flex-col gap-3'>
          <div className='flex justify-between'>
            <h1 className='mb-1 text-xl sm:text-3xl font-black text-foreground'>
              Phrasal Verbs
            </h1>
            <Button asChild className='shrink-0'>
              <Link href='/phrasal-verbs/practice'>Let&apos;s practice</Link>
            </Button>
          </div>
          <p className='text-sm sm:text-base font-medium text-muted-foreground'>
            Train your English with real phrasal verbs and native examples.
          </p>
        </div>
      </section>

      <PhrasalVerbsExplorer />
    </div>
  );
}
