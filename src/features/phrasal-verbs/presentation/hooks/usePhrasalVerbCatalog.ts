'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ensurePhrasalVerbCatalogHydrated } from '@/features/phrasal-verbs/application/usecases/EnsurePhrasalVerbCatalogHydrated.usecase';
import { getPhrasalVerbCatalogStatus } from '@/features/phrasal-verbs/application/usecases/GetPhrasalVerbCatalogStatus.usecase';
import { queryPhrasalVerbCatalog } from '@/features/phrasal-verbs/application/usecases/QueryPhrasalVerbCatalog.usecase';
import type {
  CatalogHydrationPhase,
  CatalogHydrationProgress,
  PhrasalVerbCatalogStatus,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbCatalog';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { PhrasalVerbCatalogRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbCatalogRepository.interface';
import { LocalFirstPhrasalVerbCatalogRepository } from '@/features/phrasal-verbs/infrastructure/repositories/LocalFirstPhrasalVerbCatalogRepository';

const SEARCH_DEBOUNCE_MS = 120;

export interface UsePhrasalVerbCatalogParams {
  superGroup: string | null;
  group: string | null;
  categories: string[];
  searchTerm: string;
  page: number;
  pageSize: number;
  paginate: boolean;
}

export interface CatalogHydrationState {
  phase: CatalogHydrationPhase;
  completed: number;
  total: number;
  message: string;
  error: string | null;
}

export interface UsePhrasalVerbCatalogResult {
  hydration: CatalogHydrationState;
  status: PhrasalVerbCatalogStatus | null;
  items: PhrasalVerb[];
  total: number;
  isQuerying: boolean;
  reloadQuery: () => void;
  retryHydration: () => void;
}

function toHydrationState(
  progress: CatalogHydrationProgress,
  error: string | null = null
): CatalogHydrationState {
  return {
    phase: progress.phase,
    completed: progress.completed,
    total: progress.total,
    message: progress.message,
    error,
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function usePhrasalVerbCatalog(
  params: UsePhrasalVerbCatalogParams
): UsePhrasalVerbCatalogResult {
  const repositoryRef = useRef<PhrasalVerbCatalogRepository | null>(null);
  if (!repositoryRef.current) {
    repositoryRef.current = new LocalFirstPhrasalVerbCatalogRepository();
  }

  const [hydration, setHydration] = useState<CatalogHydrationState>({
    phase: 'checking',
    completed: 0,
    total: 0,
    message: 'Revisando catalogo local...',
    error: null,
  });
  const [status, setStatus] = useState<PhrasalVerbCatalogStatus | null>(null);
  const [isHydrationComplete, setIsHydrationComplete] = useState(false);
  const [items, setItems] = useState<PhrasalVerb[]>([]);
  const [total, setTotal] = useState(0);
  const [isQuerying, setIsQuerying] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(params.searchTerm);
  const [queryRevision, setQueryRevision] = useState(0);
  const [hydrationRevision, setHydrationRevision] = useState(0);
  const normalizedCategories = useMemo(
    () =>
      Array.from(
        new Set(
          params.categories
            .map((category) => category.trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [params.categories]
  );
  const categorySignature = normalizedCategories.join('||');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(params.searchTerm);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [params.searchTerm]);

  const reloadQuery = useCallback(() => {
    setQueryRevision((current) => current + 1);
  }, []);

  const retryHydration = useCallback(() => {
    setHydrationRevision((current) => current + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const repository = repositoryRef.current;

    if (!repository) {
      return;
    }
    const activeRepository: PhrasalVerbCatalogRepository = repository;

    async function hydrateCatalog(): Promise<void> {
      setIsHydrationComplete(false);
      setHydration({
        phase: 'checking',
        completed: 0,
        total: 0,
        message: 'Revisando catalogo local...',
        error: null,
      });

      try {
        const hydrationResult = await ensurePhrasalVerbCatalogHydrated(activeRepository, {
          onProgress: (progress) => {
            if (isCancelled) {
              return;
            }

            setHydration(toHydrationState(progress));
          },
        });

        if (isCancelled) {
          return;
        }

        const latestStatus = await getPhrasalVerbCatalogStatus(activeRepository);
        if (isCancelled) {
          return;
        }

        setStatus(latestStatus);

        if (hydrationResult.success) {
          setHydration({
            phase: 'ready',
            completed: latestStatus.localCount,
            total: latestStatus.localCount,
            message: 'Catalogo listo para uso sin conexion.',
            error: null,
          });
          setIsHydrationComplete(true);
          return;
        }

        if (latestStatus.localCount > 0) {
          setHydration({
            phase: 'ready',
            completed: latestStatus.localCount,
            total: latestStatus.localCount,
            message:
              'Catalogo local disponible. No se pudo actualizar desde la red.',
            error: null,
          });
          setIsHydrationComplete(true);
          return;
        }

        setHydration({
          phase: 'error',
          completed: 0,
          total: 0,
          message:
            hydrationResult.error ??
            'No se pudo descargar el catalogo inicial. Conectate a internet e intenta de nuevo.',
          error:
            hydrationResult.error ??
            'No se pudo descargar el catalogo inicial. Conectate a internet e intenta de nuevo.',
        });
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = getErrorMessage(
          error,
          'No se pudo descargar el catalogo inicial. Conectate a internet e intenta de nuevo.'
        );

        setHydration({
          phase: 'error',
          completed: 0,
          total: 0,
          message,
          error: message,
        });
      } finally {
        if (!isCancelled) {
          setIsHydrationComplete(true);
        }
      }
    }

    void hydrateCatalog();

    return () => {
      isCancelled = true;
    };
  }, [hydrationRevision]);

  useEffect(() => {
    let isCancelled = false;
    const repository = repositoryRef.current;

    if (!repository || !isHydrationComplete) {
      return;
    }
    const activeRepository: PhrasalVerbCatalogRepository = repository;

    async function runQuery(): Promise<void> {
      try {
        setIsQuerying(true);

        const result = await queryPhrasalVerbCatalog(activeRepository, {
          superGroup: params.superGroup,
          group: params.group,
          categories: normalizedCategories,
          searchTerm: debouncedSearchTerm,
          page: params.page,
          pageSize: params.pageSize,
          paginate: params.paginate,
        });

        if (isCancelled) {
          return;
        }

        setItems(result.items);
        setTotal(result.total);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message = getErrorMessage(
          error,
          'No se pudo consultar el catalogo local.'
        );
        setItems([]);
        setTotal(0);
        setHydration((current) => ({
          ...current,
          phase: 'error',
          message,
          error: message,
        }));
      } finally {
        if (!isCancelled) {
          setIsQuerying(false);
        }
      }
    }

    void runQuery();

    return () => {
      isCancelled = true;
    };
  }, [
    categorySignature,
    debouncedSearchTerm,
    isHydrationComplete,
    params.group,
    params.page,
    params.pageSize,
    params.paginate,
    params.superGroup,
    queryRevision,
  ]);

  return {
    hydration,
    status,
    items,
    total,
    isQuerying,
    reloadQuery,
    retryHydration,
  };
}
