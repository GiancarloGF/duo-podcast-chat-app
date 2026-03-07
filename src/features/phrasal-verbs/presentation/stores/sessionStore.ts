import { create } from 'zustand';
import type { PracticeQueueBlock } from '@/features/phrasal-verbs/application/usecases/BuildPracticeQueue.usecase';
import type {
  LocalSrsMetaRow,
  SessionProgressPatch,
  ExerciseResult,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';
import type {
  PracticeExerciseBlock,
  SessionContextState,
  SessionPhase,
  SessionStoreState,
} from '@/features/phrasal-verbs/presentation/session.types';

interface SessionStoreActions {
  reset: () => void;
  setLoading: (isLoading: boolean) => void;
  setGeneratingExercise: (isGeneratingExercise: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (message: string | null) => void;
  setPendingCount: (count: number) => void;
  bootstrapSession: (payload: {
    session: SessionContextState;
    practicePlan: PracticeQueueBlock[];
    practiceQueue: PracticeExerciseBlock[];
    srsMeta: LocalSrsMetaRow | null;
    srsProgressMap: SessionStoreState['srsProgressMap'];
  }) => void;
  appendPracticeBlock: (block: PracticeExerciseBlock) => void;
  startTheory: () => void;
  completeTheory: () => void;
  answerExercise: (pvId: string, answer: string | number | undefined) => void;
  goToNextQuestion: () => void;
  completePractice: (results: ExerciseResult[]) => void;
  persistSession: (payload: {
    updatedMeta: LocalSrsMetaRow | null;
    updatedProgressByPvId: SessionProgressPatch[];
    completedAt: number;
  }) => void;
  syncFromServerSnapshot: (payload: {
    srsMeta: LocalSrsMetaRow | null;
    updatedProgressByPvId: SessionProgressPatch[];
  }) => void;
  setPhase: (phase: SessionPhase) => void;
}

export type SessionStore = SessionStoreState & SessionStoreActions;

function createInitialState(): SessionStoreState {
  return {
    phase: 'loading',
    isLoading: false,
    isGeneratingExercise: false,
    isSaving: false,
    session: null,
    practicePlan: [],
    practiceQueue: [],
    currentQuestionIndex: 0,
    answers: {},
    results: [],
    srsMeta: null,
    srsProgressMap: new Map(),
    pendingCount: 0,
    error: null,
  };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  ...createInitialState(),

  reset: () => {
    set(createInitialState());
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setGeneratingExercise: (isGeneratingExercise) => {
    set({ isGeneratingExercise });
  },

  setSaving: (isSaving) => {
    set({ isSaving });
  },

  setError: (message) => {
    set({ error: message, phase: message ? 'error' : get().phase });
  },

  setPendingCount: (count) => {
    set({ pendingCount: count });
  },

  bootstrapSession: ({ session, practicePlan, practiceQueue, srsMeta, srsProgressMap }) => {
    set({
      session,
      practicePlan,
      practiceQueue,
      srsMeta,
      srsProgressMap,
      currentQuestionIndex: 0,
      answers: {},
      results: [],
      error: null,
      phase: 'theory',
      isLoading: false,
      isGeneratingExercise: false,
      isSaving: false,
    });
  },

  appendPracticeBlock: (block) => {
    set((state) => {
      if (state.practiceQueue.some((entry) => entry.blockId === block.blockId)) {
        return state;
      }

      return {
        practiceQueue: [...state.practiceQueue, block],
      };
    });
  },

  startTheory: () => {
    set({ phase: 'theory', error: null });
  },

  completeTheory: () => {
    set({ phase: 'practice', error: null });
  },

  answerExercise: (pvId, answer) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [pvId]: answer,
      },
    }));
  },

  goToNextQuestion: () => {
    set((state) => ({
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        Math.max(0, state.practiceQueue.length - 1),
      ),
    }));
  },

  completePractice: (results) => {
    set({
      results,
      phase: 'summary',
      error: null,
    });
  },

  persistSession: ({ updatedMeta, updatedProgressByPvId, completedAt }) => {
    set((state) => {
      const nextProgressMap = new Map(state.srsProgressMap);

      updatedProgressByPvId.forEach((entry) => {
        nextProgressMap.set(entry.pvId, {
          pvId: entry.pvId,
          status: entry.value.s,
          easeFactor: entry.value.e,
          interval: entry.value.i,
          repetitions: entry.value.rp,
          nextReview: entry.value.nr,
          lastReview: entry.value.lr,
          timesCorrect: entry.value.tc,
          timesIncorrect: entry.value.ti,
          timesViewed: entry.value.tv,
          updatedAt: completedAt,
        });
      });

      return {
        srsMeta: updatedMeta,
        srsProgressMap: nextProgressMap,
        isSaving: false,
      };
    });
  },

  syncFromServerSnapshot: ({ srsMeta, updatedProgressByPvId }) => {
    set((state) => {
      const nextProgressMap = new Map(state.srsProgressMap);

      updatedProgressByPvId.forEach((entry) => {
        nextProgressMap.set(entry.pvId, {
          pvId: entry.pvId,
          status: entry.value.s,
          easeFactor: entry.value.e,
          interval: entry.value.i,
          repetitions: entry.value.rp,
          nextReview: entry.value.nr,
          lastReview: entry.value.lr,
          timesCorrect: entry.value.tc,
          timesIncorrect: entry.value.ti,
          timesViewed: entry.value.tv,
          updatedAt: Date.now(),
        });
      });

      return {
        srsMeta,
        srsProgressMap: nextProgressMap,
      };
    });
  },

  setPhase: (phase) => {
    set({ phase });
  },
}));
