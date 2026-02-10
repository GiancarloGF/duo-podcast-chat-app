'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import { PHRASAL_VERB_GROUPS } from '@/features/phrasal-verbs/infrastructure/data/phrasalVerbGroups';
import { FirestorePhrasalVerbRepository } from '@/features/phrasal-verbs/infrastructure/repositories/FirestorePhrasalVerbRepository';
import {
  cleanLabel,
  filterPhrasalVerbs,
  getCategoryOptions,
  getGroupOptions,
  normalizeText,
} from '@/features/phrasal-verbs/application/utils/phrasalVerbFilters';
import { Button } from '@/shared/presentation/components/ui/button';
import { Badge } from '@/shared/presentation/components/ui/badge';
import { Spinner } from '@/shared/presentation/components/ui/spinner';
import { Input } from '@/shared/presentation/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/presentation/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/presentation/components/ui/dialog';

const PAGE_SIZE = 10;

type NavigatorLevel = 'super-group' | 'group' | 'category';

function SelectionTag({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${
        isActive
          ? 'border-border bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--color-border)]'
          : 'border-border bg-card text-foreground hover:bg-muted hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_var(--color-border)]'
      }`}
      aria-pressed={isActive}
    >
      {label}
    </button>
  );
}

export function PhrasalVerbsExplorer() {
  const [phrasalVerbs, setPhrasalVerbs] = useState<PhrasalVerb[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSuperGroupId, setSelectedSuperGroupId] = useState<string | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [selectedPhrasalVerb, setSelectedPhrasalVerb] = useState<PhrasalVerb | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const repository = new FirestorePhrasalVerbRepository();

    async function loadPhrasalVerbs() {
      try {
        setIsLoading(true);
        setError(null);
        const entries = await repository.getAllPhrasalVerbs();
        const sortedEntries = [...entries].sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.getTime() - a.createdAt.getTime();
          }

          return a.phrasalVerb.localeCompare(b.phrasalVerb);
        }
        );
        setPhrasalVerbs(sortedEntries);
      } catch (loadError) {
        console.error('Error al cargar phrasal verbs', loadError);
        setError('No se pudieron cargar los phrasal verbs. Intenta recargar.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadPhrasalVerbs();
  }, []);

  const selectedSuperGroup = useMemo(
    () =>
      PHRASAL_VERB_GROUPS.find((item) => item.id === selectedSuperGroupId) ?? null,
    [selectedSuperGroupId]
  );

  const groupOptions = useMemo(
    () =>
      selectedSuperGroupId
        ? getGroupOptions(PHRASAL_VERB_GROUPS, selectedSuperGroupId)
        : [],
    [selectedSuperGroupId]
  );

  const categoryOptions = useMemo(
    () => {
      if (!selectedSuperGroupId || !selectedGroupKey || selectedGroupKey === 'all') {
        return [];
      }

      return getCategoryOptions(
        PHRASAL_VERB_GROUPS,
        selectedSuperGroupId,
        selectedGroupKey
      );
    },
    [selectedSuperGroupId, selectedGroupKey]
  );

  const selectedGroupTitle = useMemo(
    () =>
      selectedGroupKey && selectedGroupKey !== 'all'
        ? groupOptions.find((item) => item.key === selectedGroupKey)?.label ?? null
        : null,
    [groupOptions, selectedGroupKey]
  );

  const selectedCategoryLabel = useMemo(
    () =>
      selectedCategoryKey && selectedCategoryKey !== 'all'
        ? categoryOptions.find((item) => item.key === selectedCategoryKey)?.label ?? null
        : null,
    [categoryOptions, selectedCategoryKey]
  );

  const currentLevel: NavigatorLevel = useMemo(() => {
    if (!selectedSuperGroupId) {
      return 'super-group';
    }

    if (!selectedGroupKey || selectedGroupKey === 'all') {
      return 'group';
    }

    return 'category';
  }, [selectedSuperGroupId, selectedGroupKey]);

  const filteredPhrasalVerbs = useMemo(
    () =>
      filterPhrasalVerbs(
        phrasalVerbs,
        selectedSuperGroup?.title ?? null,
        selectedGroupTitle ?? null,
        selectedCategoryLabel
      ),
    [
      phrasalVerbs,
      selectedSuperGroup?.title,
      selectedGroupTitle,
      selectedCategoryLabel,
    ]
  );

  const searchedPhrasalVerbs = useMemo(() => {
    const normalizedSearchTerm = normalizeText(searchTerm);
    if (!normalizedSearchTerm) {
      return filteredPhrasalVerbs;
    }

    return filteredPhrasalVerbs.filter((phrasalVerb) => {
      const searchableText = [
        phrasalVerb.phrasalVerb,
        phrasalVerb.verb,
        phrasalVerb.meaning,
        phrasalVerb.definition,
      ]
        .map((value) => normalizeText(value))
        .join(' ');

      return searchableText.includes(normalizedSearchTerm);
    });
  }, [filteredPhrasalVerbs, searchTerm]);

  const shouldPaginate = selectedCategoryKey !== null ? selectedCategoryKey === 'all' : true;
  const totalPages = shouldPaginate
    ? Math.max(1, Math.ceil(searchedPhrasalVerbs.length / PAGE_SIZE))
    : 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const visiblePhrasalVerbs = useMemo(() => {
    if (!shouldPaginate) {
      return searchedPhrasalVerbs;
    }

    const offset = (currentPage - 1) * PAGE_SIZE;
    return searchedPhrasalVerbs.slice(offset, offset + PAGE_SIZE);
  }, [searchedPhrasalVerbs, shouldPaginate, currentPage]);

  function handleSelectSuperGroup(value: string) {
    setSelectedSuperGroupId(value);
    setSelectedGroupKey('all');
    setSelectedCategoryKey(null);
    setCurrentPage(1);
  }

  function handleSelectGroup(value: string) {
    setSelectedGroupKey(value);
    setSelectedCategoryKey(value === 'all' ? null : 'all');
    setCurrentPage(1);
  }

  function handleSelectCategory(value: string) {
    setSelectedCategoryKey(value);
    setCurrentPage(1);
  }

  function resetFilters() {
    setSelectedSuperGroupId(null);
    setSelectedGroupKey(null);
    setSelectedCategoryKey(null);
    setCurrentPage(1);
  }

  function goToSuperGroupLevel() {
    if (!selectedSuperGroupId) {
      return;
    }

    setSelectedGroupKey('all');
    setSelectedCategoryKey(null);
    setCurrentPage(1);
  }

  function goToGroupLevel() {
    if (!selectedGroupKey || selectedGroupKey === 'all') {
      return;
    }

    setSelectedCategoryKey('all');
    setCurrentPage(1);
  }

  const animatedListKey = `${currentLevel}-${selectedSuperGroupId ?? 'all'}-${selectedGroupKey ?? 'all'}`;

  return (
    <div className='space-y-8'>
      <Collapsible
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        className='rounded-[10px] border-2 border-border bg-card p-5 shadow-[8px_8px_0_0_var(--color-border)]'
      >
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            <p className='text-sm font-black uppercase tracking-wide'>Filtrar phrasal verbs</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant='outline' size='sm'>
              {isFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className='data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 mt-5 space-y-4'>
          <div className='flex flex-wrap items-center gap-2 rounded-[8px] border-2 border-border bg-muted p-3'>
            <button
              type='button'
              onClick={resetFilters}
              className='font-black uppercase tracking-wide hover:underline'
            >
              All
            </button>
            {selectedSuperGroup && (
              <>
                <ChevronRight className='h-4 w-4' />
                <button
                  type='button'
                  onClick={goToSuperGroupLevel}
                  className='rounded-[6px] border-2 border-border px-2 py-1 text-xs font-black uppercase tracking-wide'
                  style={{ backgroundColor: selectedSuperGroup.color }}
                >
                  {selectedSuperGroup.title}
                </button>
              </>
            )}
            {selectedGroupTitle && (
              <>
                <ChevronRight className='h-4 w-4' />
                <button
                  type='button'
                  onClick={goToGroupLevel}
                  className='rounded-[6px] border-2 border-border bg-accent px-2 py-1 text-xs font-black uppercase tracking-wide'
                >
                  {selectedGroupTitle}
                </button>
              </>
            )}
          </div>

          <div
            key={animatedListKey}
            className='animate-in fade-in-0 slide-in-from-bottom-2 duration-300'
          >
            {currentLevel === 'super-group' && (
              <div>
                <p className='mb-3 text-xs font-bold uppercase text-muted-foreground'>
                  Selecciona un supergrupo
                </p>
                <div className='flex flex-wrap gap-2'>
                  {PHRASAL_VERB_GROUPS.map((superGroup) => (
                    <SelectionTag
                      key={superGroup.id}
                      label={superGroup.title}
                      isActive={selectedSuperGroupId === superGroup.id}
                      onClick={() => handleSelectSuperGroup(superGroup.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentLevel === 'group' && (
              <div>
                <p className='mb-3 text-xs font-bold uppercase text-muted-foreground'>
                  Selecciona un grupo
                </p>
                <div className='flex flex-wrap gap-2'>
                  <SelectionTag
                    label='Todos'
                    isActive={selectedGroupKey === 'all'}
                    onClick={() => handleSelectGroup('all')}
                  />
                  {groupOptions.map((group) => (
                    <SelectionTag
                      key={group.key}
                      label={`${group.number}. ${group.label}`}
                      isActive={selectedGroupKey === group.key}
                      onClick={() => handleSelectGroup(group.key)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentLevel === 'category' && (
              <div>
                <p className='mb-3 text-xs font-bold uppercase text-muted-foreground'>
                  Selecciona una categoria
                </p>
                <div className='flex flex-wrap gap-2'>
                  <SelectionTag
                    label='Todas'
                    isActive={selectedCategoryKey === 'all'}
                    onClick={() => handleSelectCategory('all')}
                  />
                  {categoryOptions.map((category) => (
                    <SelectionTag
                      key={category.key}
                      label={cleanLabel(category.label)}
                      isActive={selectedCategoryKey === category.key}
                      onClick={() => handleSelectCategory(category.key)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <section className='space-y-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder='Buscar un phrasal verb...'
            className='pl-10'
          />
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='outline' className='gap-1'>
            {searchedPhrasalVerbs.length} resultados
          </Badge>
          {selectedSuperGroup && (
            <Badge className='bg-secondary text-secondary-foreground'>
              {selectedSuperGroup.title}
            </Badge>
          )}
          {selectedGroupTitle && (
            <Badge className='bg-accent text-accent-foreground'>
              {selectedGroupTitle}
            </Badge>
          )}
          {selectedCategoryLabel && (
            <Badge>{selectedCategoryLabel}</Badge>
          )}
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center rounded-[10px] border-2 border-border bg-card p-12 shadow-[6px_6px_0_0_var(--color-border)]'>
            <Spinner className='mr-2 h-5 w-5' />
            <p className='font-semibold'>Cargando phrasal verbs...</p>
          </div>
        ) : error ? (
          <div className='rounded-[10px] border-2 border-border bg-destructive/10 p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
            <p className='font-bold text-destructive'>{error}</p>
          </div>
        ) : searchedPhrasalVerbs.length === 0 ? (
          <div className='rounded-[10px] border-2 border-border bg-card p-8 text-center shadow-[6px_6px_0_0_var(--color-border)]'>
            <p className='font-bold'>No hay phrasal verbs para esta busqueda.</p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
              {visiblePhrasalVerbs.map((phrasalVerb) => (
                <button
                  type='button'
                  key={phrasalVerb.id}
                  onClick={() => setSelectedPhrasalVerb(phrasalVerb)}
                  className='group relative overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[6px_6px_0_0_var(--color-border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--color-border)]'
                >
                  <span className='sr-only'>{phrasalVerb.phrasalVerb}</span>
                  <div className='relative aspect-[21/10] w-full bg-muted'>
                    {phrasalVerb.imageUrl ? (
                      <img
                        src={phrasalVerb.imageUrl}
                        alt={phrasalVerb.phrasalVerb}
                        className='h-full w-full bg-card object-contain p-1 transition-transform duration-300 group-hover:scale-105'
                      />
                    ) : (
                      <div className='flex h-full items-center justify-center text-xs font-black uppercase text-muted-foreground'>
                        Sin imagen
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {shouldPaginate && totalPages > 1 && (
              <div className='flex flex-wrap items-center justify-center gap-2 rounded-[10px] border-2 border-border bg-card p-3 shadow-[6px_6px_0_0_var(--color-border)]'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Anterior
                </Button>
                <span className='px-3 text-xs font-black uppercase tracking-wide'>
                  Pagina {currentPage} de {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <Dialog
        open={Boolean(selectedPhrasalVerb)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPhrasalVerb(null);
          }
        }}
      >
        <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
          {selectedPhrasalVerb && (
            <div className='space-y-5'>
              <DialogHeader>
                <DialogTitle className='text-3xl font-black uppercase'>
                  {selectedPhrasalVerb.phrasalVerb}
                </DialogTitle>
                <DialogDescription className='font-semibold'>
                  {selectedPhrasalVerb.meaning}
                </DialogDescription>
              </DialogHeader>

              <div className='overflow-hidden rounded-[10px] border-2 border-border'>
                {selectedPhrasalVerb.imageUrl ? (
                  <img
                    src={selectedPhrasalVerb.imageUrl}
                    alt={selectedPhrasalVerb.phrasalVerb}
                    className='h-64 w-full bg-card object-contain p-1'
                  />
                ) : (
                  <div className='flex h-64 items-center justify-center bg-muted font-black uppercase text-muted-foreground'>
                    Sin imagen
                  </div>
                )}
              </div>

              <div className='space-y-3'>
                <p className='text-sm leading-relaxed'>
                  <strong>Definicion:</strong> {selectedPhrasalVerb.definition}
                </p>
                <p className='text-sm leading-relaxed'>
                  <strong>Uso comun:</strong> {selectedPhrasalVerb.commonUsage}
                </p>
                <p className='rounded-[6px] border-2 border-border bg-muted p-3 text-sm italic'>
                  {selectedPhrasalVerb.example}
                </p>
              </div>

              <div className='flex flex-wrap gap-2'>
                <Badge variant='secondary'>{selectedPhrasalVerb.superGroup}</Badge>
                <Badge variant='secondary'>{selectedPhrasalVerb.group}</Badge>
                <Badge variant='outline'>{selectedPhrasalVerb.category}</Badge>
                <Badge variant='outline'>Verb: {selectedPhrasalVerb.verb}</Badge>
                <Badge variant='outline'>Particles: {selectedPhrasalVerb.particles.join(' ')}</Badge>
                <Badge variant='outline'>{selectedPhrasalVerb.transitivity}</Badge>
                <Badge variant='outline'>{selectedPhrasalVerb.separability}</Badge>
              </div>

              {selectedPhrasalVerb.synonyms.length > 0 && (
                <div>
                  <p className='mb-2 text-xs font-black uppercase tracking-wide text-muted-foreground'>
                    Sinonimos
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedPhrasalVerb.synonyms.map((synonym) => (
                      <Badge key={synonym} variant='outline'>
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPhrasalVerb.nativeNotes.length > 0 && (
                <div>
                  <p className='mb-2 text-xs font-black uppercase tracking-wide text-muted-foreground'>
                    Notas nativas
                  </p>
                  <ul className='space-y-2'>
                    {selectedPhrasalVerb.nativeNotes.map((note) => (
                      <li
                        key={note}
                        className='rounded-[6px] border-2 border-border bg-muted px-3 py-2 text-sm'
                      >
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
