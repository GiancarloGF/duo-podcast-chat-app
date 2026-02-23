export type PhrasalVerbStatus = 'new' | 'learning' | 'review' | 'mastered';

export type SrsExerciseType =
  | 'read_and_mark_meaning'
  | 'mark_sentences_correct'
  | 'fill_in_gaps_drag_drop';

export interface PhrasalVerbProgressCompactEntry {
  s: PhrasalVerbStatus;
  e: number;
  i: number;
  rp: number;
  nr: number | null;
  lr: number | null;
  tc: number;
  ti: number;
  tv: number;
}

export interface PhrasalVerbProgressDoc {
  progress: Record<string, PhrasalVerbProgressCompactEntry>;
  meta: {
    totalViewed: number;
    totalMastered: number;
    currentStreak: number;
    longestStreak: number;
    lastSessionAt: number | null;
    analytics: SrsAnalytics;
    lastSyncAt: number;
    version: number;
  };
}

export interface SrsAnalytics {
  totalSessions: number;
  totalExercises: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  totalTimeSeconds: number;
  firstSessionAt: number | null;
}

export interface LocalPhrasalVerbProgressRow {
  pvId: string;
  status: PhrasalVerbStatus;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number | null;
  lastReview: number | null;
  timesCorrect: number;
  timesIncorrect: number;
  timesViewed: number;
  updatedAt: number;
}

export interface LocalSrsMetaRow {
  key: 'srs_meta';
  totalViewed: number;
  totalMastered: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionAt: number | null;
  analytics: SrsAnalytics;
  lastSyncAt: number;
  version: number;
}

export interface ExerciseResult {
  pvId: string;
  phrasalVerb: string;
  exerciseType: SrsExerciseType;
  isCorrect: boolean;
  answeredAt: number;
  userAnswer?: string | number;
  correctAnswer: string;
}

export interface SessionComposition {
  failed: number;
  review: number;
  new: number;
  total: number;
}

export interface PendingSrsSessionRow {
  sessionId: string;
  createdAt: number;
  status: 'pending' | 'failed';
  payload: {
    sessionId: string;
    results: ExerciseResult[];
    sessionDurationSeconds: number;
    composition: SessionComposition;
    startedAt: number;
    completedAt: number;
  };
  retryCount: number;
  lastError: string | null;
}

export interface SessionProgressPatch {
  pvId: string;
  value: PhrasalVerbProgressCompactEntry;
}
