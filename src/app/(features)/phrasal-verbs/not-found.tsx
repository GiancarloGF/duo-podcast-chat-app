import Link from 'next/link';
import { Button } from '@/shared/presentation/components/ui/button';

export default function PhrasalVerbsNotFound() {
  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <h1 className='text-xl font-black text-foreground'>Vista no encontrada</h1>
      <p className='mt-2 text-sm font-medium text-muted-foreground'>
        La sección solicitada de phrasal verbs no existe o dejó de estar disponible.
      </p>
      <Button asChild className='mt-4'>
        <Link href='/phrasal-verbs'>Volver a Phrasal Verbs</Link>
      </Button>
    </section>
  );
}
