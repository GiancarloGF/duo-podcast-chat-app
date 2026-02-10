import type { PracticeExercise } from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';

const ACTIVE_PRACTICE_SESSION_KEY = 'phrasal_verbs_active_practice_session_v1';

export interface PracticeSessionFilters {
  superGroup: string | null;
  group: string | null;
  categories: string[];
}

export interface IncorrectPvRecord {
  pvId: string;
  phrasalVerb: string;
  wrongCount: number;
  lastSentence: string;
  correctAnswer: string;
}

export interface ActivePracticeSession {
  version: 1;
  filters: PracticeSessionFilters;
  usedPvIds: string[];
  recentPvIds: string[];
  currentExercise: PracticeExercise | null;
  answersByPvId: Record<string, string | number>;
  isValidated: boolean;
  generatedExercisesCount: number;
  totalQuestions: number;
  totalCorrect: number;
  incorrectByPvId: Record<string, IncorrectPvRecord>;
  isFinished: boolean;
  startedAtIso: string;
  updatedAtIso: string;
}

export const practiceSessionStorage = {
  getActiveSession(): ActivePracticeSession | null {
    try {
      const data = localStorage.getItem(ACTIVE_PRACTICE_SESSION_KEY);
      if (!data) {
        return null;
      }

      return JSON.parse(data) as ActivePracticeSession;
    } catch (error) {
      console.error('[practiceSessionStorage] Failed to read active session', error);
      return null;
    }
  },

  saveActiveSession(session: ActivePracticeSession): void {
    try {
      localStorage.setItem(ACTIVE_PRACTICE_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('[practiceSessionStorage] Failed to save active session', error);
    }
  },

  clearActiveSession(): void {
    try {
      localStorage.removeItem(ACTIVE_PRACTICE_SESSION_KEY);
    } catch (error) {
      console.error('[practiceSessionStorage] Failed to clear active session', error);
    }
  },
};
