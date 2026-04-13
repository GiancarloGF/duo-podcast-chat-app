import { Spinner } from '@/shared/presentation/components/ui/spinner';

export default function StoriesLoading() {
  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-8 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='flex items-center gap-3'>
        <Spinner className='h-5 w-5' />
        <p className='font-semibold text-foreground'>Cargando historias...</p>
      </div>
    </section>
  );
}
