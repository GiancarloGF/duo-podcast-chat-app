'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import { filterPhrasalVerbs } from '@/features/phrasal-verbs/application/utils/phrasalVerbFilters';
import { FirestorePhrasalVerbRepository } from '@/features/phrasal-verbs/infrastructure/repositories/FirestorePhrasalVerbRepository';
import { Spinner } from '@/shared/presentation/components/ui/spinner';

interface PracticeSessionPreviewProps {
  superGroup: string | null;
  group: string | null;
  category: string | null;
}

export function PracticeSessionPreview({
  superGroup,
  group,
  category,
}: PracticeSessionPreviewProps) {

  const [phrasalVerbs, setPhrasalVerbs] = useState<PhrasalVerb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const repository = new FirestorePhrasalVerbRepository();

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const entries = await repository.getAllPhrasalVerbs();
        setPhrasalVerbs(entries);
      } catch (loadError) {
        console.error('Error al cargar sesión de práctica', loadError);
        setError('No se pudieron cargar los phrasal verbs de esta categoría.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const categoryPhrasalVerbs = useMemo(
    () => filterPhrasalVerbs(phrasalVerbs, superGroup, group, category),
    [phrasalVerbs, superGroup, group, category]
  );

  if (!category) {
    return (
      <div className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
        <p className='font-bold'>No se encontró una categoría para iniciar la práctica.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center rounded-[10px] border-2 border-border bg-card p-12 shadow-[6px_6px_0_0_var(--color-border)]'>
        <Spinner className='mr-2 h-5 w-5' />
        <p className='font-semibold'>Cargando sesión...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded-[10px] border-2 border-border bg-destructive/10 p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
        <p className='font-bold text-destructive'>{error}</p>
      </div>
    );
  }

  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-6 shadow-[8px_8px_0_0_var(--color-border)]'>
      <h2 className='mb-4 text-xl font-black'>Phrasal verbs de {category}</h2>
      {categoryPhrasalVerbs.length === 0 ? (
        <p className='font-medium text-muted-foreground'>No hay phrasal verbs en esta categoría.</p>
      ) : (
        <ul className='space-y-2'>
          {categoryPhrasalVerbs.map((phrasalVerb) => (
            <li
              key={phrasalVerb.id}
              className='rounded-[6px] border-2 border-border bg-muted px-3 py-2 text-sm'
            >
              <strong>{phrasalVerb.phrasalVerb}</strong> - {phrasalVerb.meaning}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
