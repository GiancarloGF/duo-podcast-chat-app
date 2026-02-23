import Dexie, { type Table } from 'dexie';
import type {
  LocalPhrasalVerbProgressRow,
  LocalSrsMetaRow,
  PendingSrsSessionRow,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

const PHRASAL_VERB_SRS_DB_NAME = 'podcast-chat-phrasal-verbs-srs';
export const PHRASAL_VERB_SRS_SCHEMA_VERSION = 1;

class PhrasalVerbSrsDb extends Dexie {
  progress!: Table<LocalPhrasalVerbProgressRow, string>;
  srsMeta!: Table<LocalSrsMetaRow, string>;
  pendingSessions!: Table<PendingSrsSessionRow, string>;

  constructor() {
    super(PHRASAL_VERB_SRS_DB_NAME);

    this.version(PHRASAL_VERB_SRS_SCHEMA_VERSION).stores({
      progress: 'pvId, status, nextReview, [status+nextReview]',
      srsMeta: 'key',
      pendingSessions: 'sessionId, createdAt, status',
    });
  }
}

export const phrasalVerbSrsDb = new PhrasalVerbSrsDb();
