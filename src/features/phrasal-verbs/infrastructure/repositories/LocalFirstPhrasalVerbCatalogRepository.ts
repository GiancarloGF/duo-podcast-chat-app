import Dexie, { type Collection } from 'dexie';
import type {
  CatalogHydrationProgress,
  CatalogHydrationResult,
  PhrasalVerbCatalogQuery,
  PhrasalVerbCatalogQueryResult,
  PhrasalVerbCatalogStatus,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbCatalog';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { PhrasalVerbCatalogRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbCatalogRepository.interface';
import type { PhrasalVerbRepository } from '@/features/phrasal-verbs/domain/repositories/PhrasalVerbRepository.interface';
import { FirestorePhrasalVerbRepository } from '@/features/phrasal-verbs/infrastructure/repositories/FirestorePhrasalVerbRepository';
import {
  phrasalVerbCatalogDb,
  PHRASAL_VERB_CATALOG_META_KEY,
  PHRASAL_VERB_CATALOG_SCHEMA_VERSION,
  type LocalPhrasalVerbRow,
} from '@/features/phrasal-verbs/infrastructure/storage/phrasalVerbCatalogDb';

const BULK_INSERT_CHUNK_SIZE = 200;

function normalizeCatalogText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Error desconocido al preparar el catalogo local.';
}

function mapPhrasalVerbToRow(phrasalVerb: PhrasalVerb): LocalPhrasalVerbRow {
  const searchBlobNorm = normalizeCatalogText(
    [
      phrasalVerb.phrasalVerb,
      phrasalVerb.verb,
      phrasalVerb.meaning,
      phrasalVerb.definition,
    ].join(' ')
  );

  return {
    id: phrasalVerb.id,
    phrasalVerb: phrasalVerb.phrasalVerb,
    verb: phrasalVerb.verb,
    particles: phrasalVerb.particles,
    superGroup: phrasalVerb.superGroup,
    group: phrasalVerb.group,
    category: phrasalVerb.category,
    meaning: phrasalVerb.meaning,
    definition: phrasalVerb.definition,
    example: phrasalVerb.example,
    commonUsage: phrasalVerb.commonUsage,
    transitivity: phrasalVerb.transitivity,
    separability: phrasalVerb.separability,
    imageUrl: phrasalVerb.imageUrl,
    synonyms: phrasalVerb.synonyms,
    nativeNotes: phrasalVerb.nativeNotes,
    createdAtMs: phrasalVerb.createdAt ? phrasalVerb.createdAt.getTime() : null,
    phrasalVerbNorm: normalizeCatalogText(phrasalVerb.phrasalVerb),
    superGroupNorm: normalizeCatalogText(phrasalVerb.superGroup),
    groupNorm: normalizeCatalogText(phrasalVerb.group),
    categoryNorm: normalizeCatalogText(phrasalVerb.category),
    searchBlobNorm,
  };
}

function mapRowToPhrasalVerb(row: LocalPhrasalVerbRow): PhrasalVerb {
  return {
    id: row.id,
    phrasalVerb: row.phrasalVerb,
    verb: row.verb,
    particles: row.particles,
    superGroup: row.superGroup,
    group: row.group,
    category: row.category,
    meaning: row.meaning,
    definition: row.definition,
    example: row.example,
    commonUsage: row.commonUsage,
    transitivity: row.transitivity,
    separability: row.separability,
    imageUrl: row.imageUrl,
    synonyms: row.synonyms,
    nativeNotes: row.nativeNotes,
    createdAt: row.createdAtMs ? new Date(row.createdAtMs) : null,
  };
}

function chunkRows(rows: LocalPhrasalVerbRow[], chunkSize: number): LocalPhrasalVerbRow[][] {
  const chunks: LocalPhrasalVerbRow[][] = [];

  for (let start = 0; start < rows.length; start += chunkSize) {
    chunks.push(rows.slice(start, start + chunkSize));
  }

  return chunks;
}

export class LocalFirstPhrasalVerbCatalogRepository
  implements PhrasalVerbCatalogRepository
{
  constructor(
    private readonly remoteRepository: PhrasalVerbRepository = new FirestorePhrasalVerbRepository()
  ) {}

  async ensureCatalogHydrated(options?: {
    onProgress?: (progress: CatalogHydrationProgress) => void;
    forceRefresh?: boolean;
  }): Promise<CatalogHydrationResult> {
    const onProgress = options?.onProgress;
    const forceRefresh = options?.forceRefresh ?? false;

    onProgress?.({
      phase: 'checking',
      completed: 0,
      total: 0,
      message: 'Revisando catalogo local...',
    });

    let initialStatus = await this.getCatalogStatus();
    console.info('[PhrasalVerbCatalog] hydration check', {
      localCount: initialStatus.localCount,
      isHydrated: initialStatus.isHydrated,
      schemaVersion: initialStatus.schemaVersion,
      hydratedAtIso: initialStatus.hydratedAtIso,
    });

    if (forceRefresh) {
      console.info('[PhrasalVerbCatalog] force refresh requested, clearing IndexedDB');
      await phrasalVerbCatalogDb.transaction(
        'rw',
        phrasalVerbCatalogDb.phrasalVerbs,
        phrasalVerbCatalogDb.catalogMeta,
        async () => {
          await phrasalVerbCatalogDb.phrasalVerbs.clear();
          await phrasalVerbCatalogDb.catalogMeta.delete(PHRASAL_VERB_CATALOG_META_KEY);
        }
      );
      initialStatus = await this.getCatalogStatus();
    }

    if (initialStatus.isHydrated) {
      console.info(
        '[PhrasalVerbCatalog] cache hit: using IndexedDB, skipping Firebase fetch'
      );
      onProgress?.({
        phase: 'ready',
        completed: initialStatus.localCount,
        total: initialStatus.localCount,
        message: 'Catalogo listo para uso sin conexion.',
      });

      return {
        success: true,
        status: initialStatus,
      };
    }

    try {
      console.info(
        '[PhrasalVerbCatalog] cache miss: requesting full catalog from Firebase'
      );
      onProgress?.({
        phase: 'downloading',
        completed: 0,
        total: 0,
        message: 'Descargando catalogo inicial...',
      });

      const remoteEntries = await this.remoteRepository.getAllPhrasalVerbs();
      console.info('[PhrasalVerbCatalog] Firebase response received', {
        remoteCount: remoteEntries.length,
      });
      const mappedRows = remoteEntries.map(mapPhrasalVerbToRow);

      onProgress?.({
        phase: 'persisting',
        completed: 0,
        total: mappedRows.length,
        message: `Guardando en tu dispositivo 0/${mappedRows.length}...`,
      });

      const chunks = chunkRows(mappedRows, BULK_INSERT_CHUNK_SIZE);
      let persistedCount = 0;

      await phrasalVerbCatalogDb.transaction(
        'rw',
        phrasalVerbCatalogDb.phrasalVerbs,
        phrasalVerbCatalogDb.catalogMeta,
        async () => {
          await phrasalVerbCatalogDb.phrasalVerbs.clear();

          for (const chunk of chunks) {
            await phrasalVerbCatalogDb.phrasalVerbs.bulkPut(chunk);
            persistedCount += chunk.length;

            onProgress?.({
              phase: 'persisting',
              completed: persistedCount,
              total: mappedRows.length,
              message: `Guardando en tu dispositivo ${persistedCount}/${mappedRows.length}...`,
            });
          }

          await phrasalVerbCatalogDb.catalogMeta.put({
            key: PHRASAL_VERB_CATALOG_META_KEY,
            schemaVersion: PHRASAL_VERB_CATALOG_SCHEMA_VERSION,
            hydratedAtIso: new Date().toISOString(),
            localCount: mappedRows.length,
          });
        }
      );

      const nextStatus = await this.getCatalogStatus();
      console.info('[PhrasalVerbCatalog] IndexedDB hydration completed', {
        localCount: nextStatus.localCount,
        hydratedAtIso: nextStatus.hydratedAtIso,
      });

      onProgress?.({
        phase: 'ready',
        completed: nextStatus.localCount,
        total: nextStatus.localCount,
        message: 'Catalogo listo para uso sin conexion.',
      });

      return {
        success: true,
        status: nextStatus,
      };
    } catch (error) {
      const errorMessage = parseErrorMessage(error);
      const nextStatus = await this.getCatalogStatus();

      if (nextStatus.localCount > 0) {
        console.warn(
          '[LocalFirstPhrasalVerbCatalogRepository] Hydration failed, using existing local catalog.',
          {
            localCount: nextStatus.localCount,
            error,
          }
        );

        return {
          success: false,
          status: nextStatus,
          error: errorMessage,
        };
      }

      onProgress?.({
        phase: 'error',
        completed: 0,
        total: 0,
        message: errorMessage,
      });

      return {
        success: false,
        status: nextStatus,
        error: errorMessage,
      };
    }
  }

  async queryCatalog(params: PhrasalVerbCatalogQuery): Promise<PhrasalVerbCatalogQueryResult> {
    const superGroupNorm = normalizeCatalogText(params.superGroup);
    const groupNorm = normalizeCatalogText(params.group);
    const normalizedCategories = Array.from(
      new Set(
        params.categories
          .map((category) => normalizeCatalogText(category))
          .filter(Boolean)
      )
    );
    const categoryNorm = normalizedCategories.length === 1 ? normalizedCategories[0] : '';
    const searchTermNorm = normalizeCatalogText(params.searchTerm);

    const safePage = Math.max(1, params.page);
    const safePageSize = Math.max(1, params.pageSize);
    const shouldPaginate = params.paginate;

    let collection = this.buildBaseCollection(superGroupNorm, groupNorm, categoryNorm);

    if (normalizedCategories.length > 1) {
      const categorySet = new Set(normalizedCategories);
      collection = collection.filter((row) => categorySet.has(row.categoryNorm));
    }

    if (searchTermNorm) {
      collection = collection.filter((row) =>
        row.searchBlobNorm.includes(searchTermNorm)
      );
    }

    const total = await collection.count();
    const rows = shouldPaginate
      ? await collection
          .offset((safePage - 1) * safePageSize)
          .limit(safePageSize)
          .toArray()
      : await collection.toArray();

    return {
      items: rows.map(mapRowToPhrasalVerb),
      total,
    };
  }

  async getCatalogStatus(): Promise<PhrasalVerbCatalogStatus> {
    const [localCount, metadata] = await Promise.all([
      phrasalVerbCatalogDb.phrasalVerbs.count(),
      phrasalVerbCatalogDb.catalogMeta.get(PHRASAL_VERB_CATALOG_META_KEY),
    ]);

    const hasValidSchema =
      metadata?.schemaVersion === PHRASAL_VERB_CATALOG_SCHEMA_VERSION;

    return {
      isHydrated: localCount > 0 && hasValidSchema,
      localCount,
      hydratedAtIso: metadata?.hydratedAtIso ?? null,
      schemaVersion: metadata?.schemaVersion ?? 0,
    };
  }

  private buildBaseCollection(
    superGroupNorm: string,
    groupNorm: string,
    categoryNorm: string
  ): Collection<LocalPhrasalVerbRow, string> {
    if (superGroupNorm && groupNorm && categoryNorm) {
      return phrasalVerbCatalogDb.phrasalVerbs
        .where('[superGroupNorm+groupNorm+categoryNorm+phrasalVerbNorm]')
        .between(
          [superGroupNorm, groupNorm, categoryNorm, Dexie.minKey],
          [superGroupNorm, groupNorm, categoryNorm, Dexie.maxKey]
        );
    }

    if (superGroupNorm && groupNorm) {
      return phrasalVerbCatalogDb.phrasalVerbs
        .where('[superGroupNorm+groupNorm+phrasalVerbNorm]')
        .between(
          [superGroupNorm, groupNorm, Dexie.minKey],
          [superGroupNorm, groupNorm, Dexie.maxKey]
        );
    }

    if (superGroupNorm) {
      return phrasalVerbCatalogDb.phrasalVerbs
        .where('[superGroupNorm+phrasalVerbNorm]')
        .between(
          [superGroupNorm, Dexie.minKey],
          [superGroupNorm, Dexie.maxKey]
        );
    }

    if (groupNorm && categoryNorm) {
      return phrasalVerbCatalogDb.phrasalVerbs
        .where('groupNorm')
        .equals(groupNorm)
        .and((row) => row.categoryNorm === categoryNorm);
    }

    if (groupNorm) {
      return phrasalVerbCatalogDb.phrasalVerbs.where('groupNorm').equals(groupNorm);
    }

    if (categoryNorm) {
      return phrasalVerbCatalogDb.phrasalVerbs
        .where('categoryNorm')
        .equals(categoryNorm);
    }

    return phrasalVerbCatalogDb.phrasalVerbs.orderBy('phrasalVerbNorm');
  }
}
