import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';

export type CatalogHydrationPhase =
  | 'checking'
  | 'downloading'
  | 'persisting'
  | 'ready'
  | 'error';

export interface CatalogHydrationProgress {
  phase: CatalogHydrationPhase;
  completed: number;
  total: number;
  message: string;
}

export interface PhrasalVerbCatalogQuery {
  superGroup: string | null;
  group: string | null;
  categories: string[];
  searchTerm: string;
  page: number;
  pageSize: number;
  paginate: boolean;
}

export interface PhrasalVerbCatalogQueryResult {
  items: PhrasalVerb[];
  total: number;
}

export interface PhrasalVerbCatalogStatus {
  isHydrated: boolean;
  localCount: number;
  hydratedAtIso: string | null;
  schemaVersion: number;
}

export interface CatalogHydrationResult {
  success: boolean;
  status: PhrasalVerbCatalogStatus;
  error?: string;
}
