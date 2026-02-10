'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PHRASAL_VERB_GROUPS } from '@/features/phrasal-verbs/infrastructure/data/phrasalVerbGroups';
import {
  getCategoryOptions,
  getGroupOptions,
} from '@/features/phrasal-verbs/application/utils/phrasalVerbFilters';
import { Button } from '@/shared/presentation/components/ui/button';

type SelectorLevel = 'super-group' | 'group' | 'category';

function SelectorCard({
  label,
  subtitle,
  badgeText,
  badgeColor,
  backgroundColor,
  isActive,
  onClick,
}: {
  label: string;
  subtitle: string;
  badgeText?: string;
  badgeColor?: string;
  backgroundColor?: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`text-left rounded-[10px] border-2 p-4 shadow-[6px_6px_0_0_var(--color-border)] transition-all ${
        isActive
          ? 'border-border bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--color-border)]'
          : 'border-border text-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--color-border)]'
      }`}
      style={
        isActive
          ? undefined
          : { backgroundColor: backgroundColor ?? 'var(--color-card)' }
      }
      aria-pressed={isActive}
    >
      {badgeText && (
        <span
          className='mb-2 inline-block rounded-[6px] border-2 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-foreground'
          style={{ backgroundColor: badgeColor ?? 'var(--color-secondary)' }}
        >
          {badgeText}
        </span>
      )}
      <p className='text-base font-black leading-tight'>{label}</p>
      <p className='mt-2 text-xs font-semibold opacity-80'>{subtitle}</p>
    </button>
  );
}

export function PracticeCategorySelector() {
  const router = useRouter();

  const [selectedSuperGroupId, setSelectedSuperGroupId] = useState<string | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<string[]>([]);

  const selectedSuperGroup = useMemo(
    () =>
      PHRASAL_VERB_GROUPS.find((superGroup) => superGroup.id === selectedSuperGroupId) ??
      null,
    [selectedSuperGroupId]
  );

  const groupOptions = useMemo(
    () =>
      selectedSuperGroupId
        ? getGroupOptions(PHRASAL_VERB_GROUPS, selectedSuperGroupId)
        : [],
    [selectedSuperGroupId]
  );

  const selectedGroup = useMemo(
    () => groupOptions.find((group) => group.key === selectedGroupKey) ?? null,
    [groupOptions, selectedGroupKey]
  );

  const categoryOptions = useMemo(() => {
    if (!selectedSuperGroupId || !selectedGroupKey) {
      return [];
    }

    return getCategoryOptions(
      PHRASAL_VERB_GROUPS,
      selectedSuperGroupId,
      selectedGroupKey
    );
  }, [selectedSuperGroupId, selectedGroupKey]);

  const selectedCategory = useMemo(
    () =>
      categoryOptions.filter((category) => selectedCategoryKeys.includes(category.key)),
    [categoryOptions, selectedCategoryKeys]
  );

  const currentLevel: SelectorLevel = useMemo(() => {
    if (!selectedSuperGroupId) {
      return 'super-group';
    }

    if (!selectedGroupKey) {
      return 'group';
    }

    return 'category';
  }, [selectedSuperGroupId, selectedGroupKey]);

  function resetToAll(): void {
    setSelectedSuperGroupId(null);
    setSelectedGroupKey(null);
    setSelectedCategoryKeys([]);
  }

  function handleSelectSuperGroup(superGroupId: string): void {
    setSelectedSuperGroupId(superGroupId);
    setSelectedGroupKey(null);
    setSelectedCategoryKeys([]);
  }

  function handleSelectGroup(groupKey: string): void {
    setSelectedGroupKey(groupKey);
    setSelectedCategoryKeys([]);
  }

  function handleSelectCategory(categoryKey: string): void {
    setSelectedCategoryKeys((previous) =>
      previous.includes(categoryKey)
        ? previous.filter((key) => key !== categoryKey)
        : [...previous, categoryKey]
    );
  }

  function goToSuperGroupLevel(): void {
    setSelectedGroupKey(null);
    setSelectedCategoryKeys([]);
  }

  function goToGroupLevel(): void {
    setSelectedCategoryKeys([]);
  }

  function startPractice(): void {
    if (!selectedSuperGroup || !selectedGroup || selectedCategory.length === 0) {
      return;
    }

    const params = new URLSearchParams({
      superGroup: selectedSuperGroup.title,
      group: selectedGroup.label,
    });

    selectedCategory.forEach((category) => {
      params.append('category', category.label);
    });

    router.push(`/phrasal-verbs/practice/session?${params.toString()}`);
  }

  const animatedListKey = `${currentLevel}-${selectedSuperGroupId ?? 'none'}-${selectedGroupKey ?? 'none'}`;

  return (
    <section className='rounded-[10px] border-2 border-border bg-card p-5 shadow-[8px_8px_0_0_var(--color-border)]'>
      <div className='mb-4 flex flex-wrap items-center gap-2 rounded-[8px] border-2 border-border bg-muted p-3'>
        <button
          type='button'
          onClick={resetToAll}
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
        {selectedGroup && (
          <>
            <ChevronRight className='h-4 w-4' />
            <button
              type='button'
              onClick={goToGroupLevel}
              className='rounded-[6px] border-2 border-border bg-accent px-2 py-1 text-xs font-black uppercase tracking-wide'
            >
              {selectedGroup.label}
            </button>
          </>
        )}
      </div>

      <div
        key={animatedListKey}
        className='animate-in fade-in-0 slide-in-from-bottom-2 duration-300'
      >
        {currentLevel === 'super-group' && (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
            {PHRASAL_VERB_GROUPS.map((superGroup) => (
              <button
                type='button'
                key={superGroup.id}
                onClick={() => handleSelectSuperGroup(superGroup.id)}
                className='text-left rounded-[10px] border-2 border-border p-4 shadow-[6px_6px_0_0_var(--color-border)] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_0_var(--color-border)]'
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
              </button>
            ))}
          </div>
        )}

        {currentLevel === 'group' && (
          <div>
            <p className='mb-3 text-xs font-bold uppercase text-muted-foreground'>
              Selecciona un grupo
            </p>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
              {groupOptions.map((group) => (
                <SelectorCard
                  key={group.key}
                  label={`${group.number}. ${group.label}`}
                  subtitle='Grupo'
                  badgeText='Grupo'
                  badgeColor={selectedSuperGroup?.color}
                  backgroundColor={selectedSuperGroup?.lightColor}
                  isActive={selectedGroupKey === group.key}
                  onClick={() => handleSelectGroup(group.key)}
                />
              ))}
            </div>
          </div>
        )}

        {currentLevel === 'category' && (
          <div className='space-y-5'>
            <div>
                <p className='mb-3 text-xs font-bold uppercase text-muted-foreground'>
                  Selecciona una o varias categorias
                </p>
                {selectedCategory.length > 0 && (
                  <p className='mb-2 text-xs font-semibold text-muted-foreground'>
                    Categorias seleccionadas: {selectedCategory.length}
                  </p>
                )}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                  {categoryOptions.map((category) => (
                    <SelectorCard
                    key={category.key}
                    label={category.label}
                    subtitle='Categoria'
                      badgeText='Categoria'
                      badgeColor={selectedSuperGroup?.color}
                      backgroundColor={selectedSuperGroup?.lightColor}
                      isActive={selectedCategoryKeys.includes(category.key)}
                      onClick={() => handleSelectCategory(category.key)}
                    />
                  ))}
              </div>
            </div>

            <Button onClick={startPractice} disabled={selectedCategory.length === 0}>
              Practicar
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
