'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import {
  getSuperGroupColorsByTitle,
  PHRASAL_VERB_GROUPS,
} from '@/features/phrasal-verbs/infrastructure/data/phrasalVerbGroups';
import {
  cleanLabel,
  getCategoryOptions,
  getGroupOptions,
} from '@/features/phrasal-verbs/application/utils/phrasalVerbFilters';
import { usePhrasalVerbCatalog } from '@/features/phrasal-verbs/presentation/hooks/usePhrasalVerbCatalog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/presentation/components/ui/dropdown-menu';

const PAGE_SIZE = 10;

type NavigatorLevel = 'super-group' | 'group' | 'category';

function getHydrationBadgeVariant(
  phase: string,
): 'default' | 'destructive' | 'outline' {
  if (phase === 'error') {
    return 'destructive';
  }

  if (phase === 'ready') {
    return 'default';
  }

  return 'outline';
}

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
      className={`rounded-full border-2 px-2 py-1 sm:px-3 sm:py-2 text-sm font-bold transition-all ${
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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedSuperGroupId, setSelectedSuperGroupId] = useState<
    string | null
  >(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>(
    [],
  );
  const [selectedPhrasalVerb, setSelectedPhrasalVerb] =
    useState<PhrasalVerb | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const selectedSuperGroup = useMemo(
    () =>
      PHRASAL_VERB_GROUPS.find((item) => item.id === selectedSuperGroupId) ??
      null,
    [selectedSuperGroupId],
  );

  const groupOptions = useMemo(
    () =>
      selectedSuperGroupId
        ? getGroupOptions(PHRASAL_VERB_GROUPS, selectedSuperGroupId)
        : [],
    [selectedSuperGroupId],
  );

  const categoryOptions = useMemo(() => {
    if (
      !selectedSuperGroupId ||
      !selectedGroupKey ||
      selectedGroupKey === 'all'
    ) {
      return [];
    }

    return getCategoryOptions(
      PHRASAL_VERB_GROUPS,
      selectedSuperGroupId,
      selectedGroupKey,
    );
  }, [selectedSuperGroupId, selectedGroupKey]);

  const selectedGroupTitle = useMemo(
    () =>
      selectedGroupKey && selectedGroupKey !== 'all'
        ? (groupOptions.find((item) => item.key === selectedGroupKey)?.label ??
          null)
        : null,
    [groupOptions, selectedGroupKey],
  );

  const selectedCategoryLabels = useMemo(
    () =>
      categoryOptions
        .filter((item) => selectedCategoryKeys.includes(item.key))
        .map((item) => item.label),
    [categoryOptions, selectedCategoryKeys],
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

  const shouldPaginate = selectedCategoryKeys.length === 0;
  const {
    hydration,
    status,
    items: visiblePhrasalVerbs,
    total,
    isQuerying,
    reloadQuery,
    retryHydration,
    refreshCatalogFromFirebase,
  } = usePhrasalVerbCatalog({
    superGroup: selectedSuperGroup?.title ?? null,
    group: selectedGroupTitle ?? null,
    categories: selectedCategoryLabels,
    searchTerm,
    page: currentPage,
    pageSize: PAGE_SIZE,
    paginate: shouldPaginate,
  });

  const isHydrating =
    hydration.phase === 'checking' ||
    hydration.phase === 'downloading' ||
    hydration.phase === 'persisting';
  const totalPages = shouldPaginate
    ? Math.max(1, Math.ceil(total / PAGE_SIZE))
    : 1;
  const hasCatalogData = (status?.localCount ?? 0) > 0;
  const isFirstLoadOfflineError =
    hydration.phase === 'error' && !hasCatalogData && total === 0;
  const isInitialLoading = isHydrating && total === 0;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleSelectSuperGroup(value: string) {
    setSelectedSuperGroupId(value);
    setSelectedGroupKey('all');
    setSelectedCategoryKeys([]);
    setCurrentPage(1);
  }

  function handleSelectGroup(value: string) {
    setSelectedGroupKey(value);
    setSelectedCategoryKeys([]);
    setCurrentPage(1);
  }

  function handleSelectCategory(value: string) {
    setSelectedCategoryKeys((previous) =>
      previous.includes(value)
        ? previous.filter((key) => key !== value)
        : [...previous, value],
    );
    setCurrentPage(1);
  }

  function handleSelectAllCategories() {
    setSelectedCategoryKeys([]);
    setCurrentPage(1);
  }

  function startPracticeSession() {
    if (!selectedSuperGroup || !selectedGroupTitle) {
      return;
    }

    const categoriesForPractice =
      selectedCategoryLabels.length > 0
        ? selectedCategoryLabels
        : categoryOptions.map((category) => category.label);

    if (categoriesForPractice.length === 0) {
      return;
    }

    const params = new URLSearchParams({
      superGroup: selectedSuperGroup.title,
      group: selectedGroupTitle,
    });

    categoriesForPractice.forEach((category) => {
      params.append('category', category);
    });

    router.push(`/phrasal-verbs/practice/session?${params.toString()}`);
  }

  function resetFilters() {
    setSelectedSuperGroupId(null);
    setSelectedGroupKey(null);
    setSelectedCategoryKeys([]);
    setCurrentPage(1);
  }

  function goToSuperGroupLevel() {
    if (!selectedSuperGroupId) {
      return;
    }

    setSelectedGroupKey('all');
    setSelectedCategoryKeys([]);
    setCurrentPage(1);
  }

  function goToGroupLevel() {
    if (!selectedGroupKey || selectedGroupKey === 'all') {
      return;
    }

    setSelectedCategoryKeys([]);
    setCurrentPage(1);
  }

  const animatedListKey = `${currentLevel}-${selectedSuperGroupId ?? 'all'}-${selectedGroupKey ?? 'all'}`;

  return (
    <div className='space-y-5'>
      <Collapsible
        open={isFiltersOpen}
        onOpenChange={setIsFiltersOpen}
        className='rounded-[10px] border-2 border-border bg-card p-4 shadow-[8px_8px_0_0_var(--color-border)]'
      >
        <section className='rounded-[10px] bg-card mb-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div className='flex flex-wrap items-center gap-2'>
              <Badge variant={getHydrationBadgeVariant(hydration.phase)}>
                {hydration.phase}
              </Badge>
              {isQuerying && (
                <Badge variant='outline' className='gap-1'>
                  <Spinner className='h-3 w-3' />
                  Querying local...
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-auto w-auto p-0 shadow-none'
                  aria-label='Abrir menu de acciones'
                >
                  <MoreHorizontal className='h-6 w-6' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={refreshCatalogFromFirebase}
                  disabled={isHydrating}
                >
                  Update data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* <p className='mt-1 text-sm font-semibold'>{hydration.message}</p> */}
          {hydration.phase === 'persisting' && hydration.total > 0 && (
            <p className='text-xs font-medium text-muted-foreground'>
              Progress: {hydration.completed}/{hydration.total}
            </p>
          )}
          {hydration.phase === 'error' && (
            <div className='mt-3 flex flex-wrap gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  retryHydration();
                  reloadQuery();
                }}
              >
                Retry
              </Button>
            </div>
          )}
        </section>
        <div className='flex items-center justify-between gap-4'>
          {/* <div className='flex items-center gap-2'>
            <Filter className='h-4 w-4' />
            <p className='text-sm font-black uppercase tracking-wide'>
              Filters
            </p>
          </div> */}
          <div className='relative flex-1'>
            <Search className='absolute left-1 sm:left-2 top-1/2 h-4 w-ful -translate-y-1/2 text-muted-foreground' />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder='Search...'
              className='pl-8 sm:pl-10'
            />
          </div>
          <CollapsibleTrigger asChild>
            <Button variant='outline' size='sm'>
              {isFiltersOpen ? 'Hide filters' : 'Show filters'}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className='data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 mt-3 space-y-3'>
          <div className='flex flex-wrap items-center gap-2 rounded-[8px] border-2 border-border bg-muted p-2'>
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
                    isActive={selectedCategoryKeys.length === 0}
                    onClick={handleSelectAllCategories}
                  />
                  {categoryOptions.map((category) => (
                    <SelectionTag
                      key={category.key}
                      label={cleanLabel(category.label)}
                      isActive={selectedCategoryKeys.includes(category.key)}
                      onClick={() => handleSelectCategory(category.key)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <section className='space-y-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='outline' className='gap-1'>
            {total} results
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
          {currentLevel === 'category' &&
            selectedCategoryLabels.length === 0 && (
              <Badge>Todas las categorías</Badge>
            )}
          {selectedCategoryLabels.map((categoryLabel) => (
            <Badge key={categoryLabel}>{categoryLabel}</Badge>
          ))}
          {currentLevel === 'category' && (
            <Button
              className='ml-auto'
              onClick={startPracticeSession}
              disabled={categoryOptions.length === 0}
            >
              Practice this
            </Button>
          )}
        </div>

        {isInitialLoading ? (
          <div className='flex items-center justify-center rounded-[10px] border-2 border-border bg-card p-12 shadow-[6px_6px_0_0_var(--color-border)]'>
            <Spinner className='mr-2 h-5 w-5' />
            <p className='font-semibold'>Preparing local catalog...</p>
          </div>
        ) : isFirstLoadOfflineError ? (
          <div className='rounded-[10px] border-2 border-border bg-destructive/10 p-6 shadow-[6px_6px_0_0_var(--color-border)]'>
            <p className='font-bold text-destructive'>
              You need internet connection to download the initial catalog.
            </p>
            <Button
              className='mt-4'
              variant='outline'
              onClick={() => {
                retryHydration();
                reloadQuery();
              }}
            >
              Retry download
            </Button>
          </div>
        ) : total === 0 ? (
          <div className='rounded-[10px] border-2 border-border bg-card p-8 text-center shadow-[6px_6px_0_0_var(--color-border)]'>
            <p className='font-bold'>
              No phrasal verbs found with the current filters.
            </p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
              {visiblePhrasalVerbs.map((phrasalVerb) => {
                const superGroupColors = getSuperGroupColorsByTitle(
                  phrasalVerb.superGroup,
                );

                return (
                  <button
                    type='button'
                    key={phrasalVerb.id}
                    onClick={() => setSelectedPhrasalVerb(phrasalVerb)}
                    className='group relative overflow-hidden rounded-[10px] border-2 border-border bg-card shadow-[6px_6px_0_0_var(--color-border)] transition-transform hover:translate-x-px hover:translate-y-px hover:shadow-[5px_5px_0_0_var(--color-border)] focus-visible:translate-x-px focus-visible:translate-y-px focus-visible:shadow-[5px_5px_0_0_var(--color-border)]'
                    style={{
                      backgroundColor:
                        superGroupColors?.lightColor ?? undefined,
                    }}
                  >
                    <span className='sr-only'>{phrasalVerb.phrasalVerb}</span>

                    <div className='pointer-events-none absolute left-2 right-2 top-1 sm:top-3 z-30 flex flex-nowrap items-center gap-2 overflow-x-hidden overflow-y-hidden pb-1'>
                      <Badge
                        className='shrink-0 border-2 border-border text-[10px] font-black uppercase tracking-wide text-white'
                        style={{
                          backgroundColor: superGroupColors?.color ?? undefined,
                        }}
                      >
                        {phrasalVerb.superGroup}
                      </Badge>
                      <Badge className='shrink-0 border-2 border-border bg-background/95 text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100'>
                        {phrasalVerb.group}
                      </Badge>
                      <Badge className='shrink-0 border-2 border-border bg-background/95 text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100'>
                        {phrasalVerb.category}
                      </Badge>
                    </div>

                    <div className='absolute inset-0 z-20 bg-black/15 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100' />

                    <div className='pointer-events-none absolute inset-0 z-30 flex flex-col justify-end p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100'>
                      <div className='flex flex-wrap gap-2'>
                        <Badge className='border-2 border-border bg-background/95 text-foreground'>
                          {phrasalVerb.transitivity}
                        </Badge>
                        <Badge className='border-2 border-border bg-background/95 text-foreground'>
                          {phrasalVerb.separability}
                        </Badge>
                      </div>
                    </div>

                    <div className='relative aspect-21/10 w-full bg-transparent'>
                      {phrasalVerb.imageUrl ? (
                        <img
                          src={phrasalVerb.imageUrl}
                          alt={phrasalVerb.phrasalVerb}
                          className='h-full w-full object-contain p-1'
                        />
                      ) : (
                        <div className='flex h-full items-center justify-center text-xs font-black uppercase text-muted-foreground'>
                          No image
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {shouldPaginate && totalPages > 1 && (
              <div className='flex flex-wrap items-center justify-center gap-2 py-8'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                  Previous
                </Button>
                <span className='px-3 text-xs font-black uppercase tracking-wide'>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
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
                <DialogDescription className='text-lg sm:text-xl font-semibold'>
                  {selectedPhrasalVerb.meaning}
                </DialogDescription>
              </DialogHeader>

              {/* <div className='overflow-hidden rounded-[10px] border-2 border-border'>
                {selectedPhrasalVerb.imageUrl ? (
                  <img
                    src={selectedPhrasalVerb.imageUrl}
                    alt={selectedPhrasalVerb.phrasalVerb}
                    className='h-64 w-full bg-card object-contain p-1'
                  />
                ) : (
                  <div className='flex h-64 items-center justify-center bg-muted font-black uppercase text-muted-foreground'>
                    No image
                  </div>
                )}
              </div> */}

              <div className='space-y-3'>
                <p className='text-base sm:text-lg leading-relaxed'>
                  <strong>Definition:</strong> {selectedPhrasalVerb.definition}
                </p>
                <p className='text-base sm:text-lg leading-relaxed'>
                  <strong>Common usage:</strong>{' '}
                  {selectedPhrasalVerb.commonUsage}
                </p>
                <div className='rounded-[6px] border-2 border-border bg-muted p-3 text-lg sm:text-xl italic'>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className='leading-relaxed not-first:mt-2'>
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className='mt-2 list-disc space-y-1 pl-5'>
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className='mt-2 list-decimal space-y-1 pl-5'>
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className='leading-relaxed'>{children}</li>
                      ),
                      strong: ({ children }) => (
                        <strong className='font-black text-purple-500'>
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className='italic'>{children}</em>
                      ),
                    }}
                  >
                    {selectedPhrasalVerb.example}
                  </ReactMarkdown>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge className='border-2 border-emerald-700 bg-emerald-100 text-emerald-900 sm:text-sm'>
                    Verb: {selectedPhrasalVerb.verb}
                  </Badge>
                  <Badge className='border-2 border-emerald-700 bg-emerald-100 text-emerald-900 sm:text-sm'>
                    Particles: {selectedPhrasalVerb.particles.join(' ')}
                  </Badge>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  <Badge className='border-2 border-violet-700 bg-violet-100 text-violet-900 sm:text-sm'>
                    {selectedPhrasalVerb.transitivity}
                  </Badge>
                  <Badge className='border-2 border-violet-700 bg-violet-100 text-violet-900 sm:text-sm'>
                    {selectedPhrasalVerb.separability}
                  </Badge>
                </div>
                <div className='flex flex-wrap items-center gap-2'>
                  <Badge variant='secondary' className='sm:text-sm font-black uppercase tracking-wide'>
                    {selectedPhrasalVerb.superGroup}
                  </Badge>
                  <Badge variant='secondary' className='sm:text-sm font-black uppercase tracking-wide'>
                    {selectedPhrasalVerb.group}
                  </Badge>
                  <Badge variant='outline' className='sm:text-sm font-black uppercase tracking-wide'>
                    {selectedPhrasalVerb.category}
                  </Badge>
                </div>
              </div>

              {selectedPhrasalVerb.synonyms.length > 0 && (
                <div>
                  <p className='mb-2 sm:text-base font-black uppercase tracking-wide text-muted-foreground'>
                    Synonyms
                  </p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedPhrasalVerb.synonyms.map((synonym) => (
                      <Badge key={synonym} variant='outline' className='sm:text-sm font-medium'>
                        {synonym}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPhrasalVerb.nativeNotes.length > 0 && (
                <div>
                  <p className='mb-2 sm:text-base font-black uppercase tracking-wide text-muted-foreground'>
                    Native notes
                  </p>
                  <ul className='space-y-2'>
                    {selectedPhrasalVerb.nativeNotes.map((note) => (
                      <li
                        key={note}
                        className='rounded-[6px] border-2 border-border bg-muted px-3 py-2 text-base sm:text-lg'
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
