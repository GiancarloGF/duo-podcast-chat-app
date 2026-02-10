import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type {
  PhrasalVerbGroupItem,
  PhrasalVerbSuperGroup,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbGroup';

export interface GroupOption {
  key: string;
  label: string;
  number: number;
  superGroupId: string;
}

export interface CategoryOption {
  key: string;
  label: string;
}

export function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function cleanLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function getGroupOptions(
  superGroups: PhrasalVerbSuperGroup[],
  selectedSuperGroupId: string
): GroupOption[] {
  const groups =
    selectedSuperGroupId === 'all'
      ? superGroups
      : superGroups.filter((superGroup) => superGroup.id === selectedSuperGroupId);

  return groups.flatMap((superGroup) =>
    superGroup.items.map((group) => ({
      key: `${superGroup.id}:${group.number}`,
      label: cleanLabel(group.title),
      number: group.number,
      superGroupId: superGroup.id,
    }))
  );
}

function getCategoriesFromGroups(groupItems: PhrasalVerbGroupItem[]): CategoryOption[] {
  const uniqueCategories = new Map<string, string>();

  groupItems.forEach((group) => {
    group.items.forEach((category) => {
      const normalized = normalizeText(category);
      if (!uniqueCategories.has(normalized)) {
        uniqueCategories.set(normalized, cleanLabel(category));
      }
    });
  });

  return Array.from(uniqueCategories.entries()).map(([key, label]) => ({
    key,
    label,
  }));
}

export function getCategoryOptions(
  superGroups: PhrasalVerbSuperGroup[],
  selectedSuperGroupId: string,
  selectedGroupKey: string
): CategoryOption[] {
  const sourceSuperGroups =
    selectedSuperGroupId === 'all'
      ? superGroups
      : superGroups.filter((superGroup) => superGroup.id === selectedSuperGroupId);

  if (selectedGroupKey === 'all') {
    return getCategoriesFromGroups(sourceSuperGroups.flatMap((superGroup) => superGroup.items));
  }

  const selectedGroup = sourceSuperGroups
    .flatMap((superGroup) =>
      superGroup.items.map((group) => ({
        key: `${superGroup.id}:${group.number}`,
        group,
      }))
    )
    .find(({ key }) => key === selectedGroupKey);

  if (!selectedGroup) {
    return [];
  }

  return getCategoriesFromGroups([selectedGroup.group]);
}

export function filterPhrasalVerbs(
  phrasalVerbs: PhrasalVerb[],
  selectedSuperGroupTitle: string | null,
  selectedGroupTitle: string | null,
  selectedCategoryLabel: string | null
): PhrasalVerb[] {
  return phrasalVerbs.filter((phrasalVerb) => {
    if (
      selectedSuperGroupTitle &&
      normalizeText(phrasalVerb.superGroup) !== normalizeText(selectedSuperGroupTitle)
    ) {
      return false;
    }

    if (
      selectedGroupTitle &&
      normalizeText(phrasalVerb.group) !== normalizeText(selectedGroupTitle)
    ) {
      return false;
    }

    if (
      selectedCategoryLabel &&
      normalizeText(phrasalVerb.category) !== normalizeText(selectedCategoryLabel)
    ) {
      return false;
    }

    return true;
  });
}
