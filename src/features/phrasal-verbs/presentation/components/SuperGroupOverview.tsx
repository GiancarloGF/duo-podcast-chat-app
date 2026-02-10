import { PHRASAL_VERB_GROUPS } from '@/features/phrasal-verbs/infrastructure/data/phrasalVerbGroups';

export function SuperGroupOverview() {
  return (
    <section className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {PHRASAL_VERB_GROUPS.map((superGroup) => (
        <article
          key={superGroup.id}
          className='rounded-[10px] border-2 border-border p-4 shadow-[6px_6px_0_0_var(--color-border)]'
          style={{ backgroundColor: superGroup.lightColor }}
        >
          <span
            className='mb-2 inline-block rounded-[6px] border-2 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide'
            style={{ backgroundColor: superGroup.color }}
          >
            {superGroup.items.length} grupos
          </span>
          <h2 className='text-base font-black text-foreground leading-tight'>
            {superGroup.title}
          </h2>
          <p className='mt-2 text-xs font-semibold text-muted-foreground'>
            {superGroup.items.reduce((acc, group) => acc + group.items.length, 0)} categorias
          </p>
        </article>
      ))}
    </section>
  );
}
