import type { PracticeQueueBlock } from '@/features/phrasal-verbs/application/usecases/BuildPracticeQueue.usecase';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type {
  ExerciseResult,
  LocalPhrasalVerbProgressRow,
  LocalSrsMetaRow,
  SessionComposition,
  SrsExerciseType,
} from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

export type SessionPhase = 'loading' | 'theory' | 'practice' | 'summary' | 'error';

export interface SessionContextState {
  sessionId: string;
  startedAt: number;
  completedAt: number | null;
  composition: SessionComposition;
  sessionPVs: PhrasalVerb[];
}

export interface PracticeExerciseBlockBase {
  blockId: string;
  exerciseType: SrsExerciseType;
  title: string;
  instructions: string;
}

export interface ReadAndMarkMeaningBlockItem {
  pvId: string;
  phrasalVerb: string;
  sentenceMarkdown: string;
  meanings: string[];
  correctMeaningIndex: number;
}

export interface ReadAndMarkMeaningBlock extends PracticeExerciseBlockBase {
  exerciseType: 'read_and_mark_meaning';
  items: ReadAndMarkMeaningBlockItem[];
}

export interface MarkSentencesCorrectBlockItem {
  pvId: string;
  phrasalVerb: string;
  firstSentenceMarkdown: string;
  secondSentenceMarkdown: string;
  correctSentenceIndex: number;
}

export interface MarkSentencesCorrectBlock extends PracticeExerciseBlockBase {
  exerciseType: 'mark_sentences_correct';
  items: MarkSentencesCorrectBlockItem[];
}

export interface FillInGapsDragDropBlockItem {
  pvId: string;
  phrasalVerb: string;
  sentencePrefix: string;
  sentenceSuffix: string;
  correctWord: string;
}

export interface FillInGapsDragDropBlock extends PracticeExerciseBlockBase {
  exerciseType: 'fill_in_gaps_drag_drop';
  items: FillInGapsDragDropBlockItem[];
  wordBank: string[];
}

export type PracticeExerciseBlock =
  | ReadAndMarkMeaningBlock
  | MarkSentencesCorrectBlock
  | FillInGapsDragDropBlock;

export type PracticeAnswersMap = Record<string, string | number | undefined>;

export interface SessionStoreState {
  phase: SessionPhase;
  isLoading: boolean;
  isGeneratingExercise: boolean;
  isSaving: boolean;
  session: SessionContextState | null;
  practicePlan: PracticeQueueBlock[];
  practiceQueue: PracticeExerciseBlock[];
  currentQuestionIndex: number;
  answers: PracticeAnswersMap;
  results: ExerciseResult[];
  srsMeta: LocalSrsMetaRow | null;
  srsProgressMap: Map<string, LocalPhrasalVerbProgressRow>;
  pendingCount: number;
  error: string | null;
}
