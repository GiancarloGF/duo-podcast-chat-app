import Dexie, { type Table } from 'dexie';

const PHRASAL_VERB_CATALOG_DB_NAME = 'podcast-chat-phrasal-verbs';
export const PHRASAL_VERB_CATALOG_META_KEY = 'phrasal_verbs_catalog';
export const PHRASAL_VERB_CATALOG_SCHEMA_VERSION = 1;

export interface LocalPhrasalVerbRow {
  id: string;
  phrasalVerb: string;
  verb: string;
  particles: string[];
  superGroup: string;
  group: string;
  category: string;
  meaning: string;
  definition: string;
  example: string;
  commonUsage: string;
  transitivity: string;
  separability: string;
  imageUrl: string;
  synonyms: string[];
  nativeNotes: string[];
  createdAtMs: number | null;
  phrasalVerbNorm: string;
  superGroupNorm: string;
  groupNorm: string;
  categoryNorm: string;
  searchBlobNorm: string;
}

export interface PhrasalVerbCatalogMetaRow {
  key: string;
  schemaVersion: number;
  hydratedAtIso: string;
  localCount: number;
}

class PhrasalVerbCatalogDb extends Dexie {
  phrasalVerbs!: Table<LocalPhrasalVerbRow, string>;
  catalogMeta!: Table<PhrasalVerbCatalogMetaRow, string>;

  constructor() {
    super(PHRASAL_VERB_CATALOG_DB_NAME);

    this.version(PHRASAL_VERB_CATALOG_SCHEMA_VERSION).stores({
      phrasalVerbs:
        'id, phrasalVerbNorm, superGroupNorm, groupNorm, categoryNorm, [superGroupNorm+phrasalVerbNorm], [superGroupNorm+groupNorm+phrasalVerbNorm], [superGroupNorm+groupNorm+categoryNorm+phrasalVerbNorm]',
      catalogMeta: 'key',
    });
  }
}

export const phrasalVerbCatalogDb = new PhrasalVerbCatalogDb();
