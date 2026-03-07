import { buildPracticeQueue, type PracticeQueueBlock } from '@/features/phrasal-verbs/application/usecases/BuildPracticeQueue.usecase';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type {
  PracticeExercise,
  PracticeExercisePhrasalVerbInput,
  PracticeExerciseRecentUsage,
  PracticeExerciseType,
} from '@/features/phrasal-verbs/infrastructure/services/practice-exercise-schema';
import type {
  FillInGapsDragDropBlock,
  MarkSentencesCorrectBlock,
  PracticeExerciseBlock,
  ReadAndMarkMeaningBlock,
} from '@/features/phrasal-verbs/presentation/session.types';

export interface PlannedPracticeSession {
  practicePlan: PracticeQueueBlock[];
  practiceQueue: PracticeExerciseBlock[];
}

export interface GeneratePracticeBlockDeps {
  exerciseType: PracticeExerciseType;
  phrasalVerbs: PracticeExercisePhrasalVerbInput[];
  recentUsage: PracticeExerciseRecentUsage[];
}

export interface GeneratePracticeBlockParams {
  practicePlan: PracticeQueueBlock[];
  practiceQueue: PracticeExerciseBlock[];
  index: number;
  generateExercise: (params: GeneratePracticeBlockDeps) => Promise<PracticeExercise>;
}

export function normalizeWord(value: string): string {
  return value.trim().toLowerCase();
}

function markdownToPlainText(value: string): string {
  return value.replace(/\*\*/g, '').trim();
}

function reorderBySelectedIds<T extends { pvId: string }>(
  items: T[],
  selectedPvIds: string[],
): T[] {
  const itemByPvId = new Map(items.map((item) => [item.pvId, item]));
  const ordered = selectedPvIds.map((pvId) => itemByPvId.get(pvId)).filter(Boolean) as T[];

  if (ordered.length !== selectedPvIds.length) {
    throw new Error('El ejercicio generado no contiene todos los PVs requeridos.');
  }

  return ordered;
}

function getRecentUsageSentence(
  block: PracticeExerciseBlock,
  pvId: string,
): string | null {
  if (block.exerciseType === 'read_and_mark_meaning') {
    const item = block.items.find((entry) => entry.pvId === pvId);
    return item ? markdownToPlainText(item.sentenceMarkdown) : null;
  }

  if (block.exerciseType === 'mark_sentences_correct') {
    const item = block.items.find((entry) => entry.pvId === pvId);
    if (!item) {
      return null;
    }

    const correctSentence =
      item.correctSentenceIndex === 0
        ? item.firstSentenceMarkdown
        : item.secondSentenceMarkdown;

    return markdownToPlainText(correctSentence);
  }

  const item = block.items.find((entry) => entry.pvId === pvId);
  if (!item) {
    return null;
  }

  return `${item.sentencePrefix} ${item.correctWord} ${item.sentenceSuffix}`.replace(/\s+/g, ' ').trim();
}

export function buildRecentUsage(
  targetBlock: PracticeQueueBlock,
  generatedBlocks: PracticeExerciseBlock[],
): PracticeExerciseRecentUsage[] {
  if (generatedBlocks.length === 0) {
    return [];
  }

  const recentUsage: PracticeExerciseRecentUsage[] = [];

  targetBlock.items.forEach(({ pv }) => {
    for (let index = generatedBlocks.length - 1; index >= 0; index -= 1) {
      const generatedBlock = generatedBlocks[index];
      const sentence = getRecentUsageSentence(generatedBlock, pv.id);

      if (!sentence) {
        continue;
      }

      recentUsage.push({
        pvId: pv.id,
        phrasalVerb: pv.phrasalVerb,
        exerciseType: generatedBlock.exerciseType,
        sentence,
      });
      break;
    }
  });

  return recentUsage;
}

export function toPracticeExerciseInput(
  phrasalVerbs: PhrasalVerb[],
): PracticeExercisePhrasalVerbInput[] {
  return phrasalVerbs.map((pv) => ({
    id: pv.id,
    phrasalVerb: pv.phrasalVerb,
    verb: pv.verb,
    particles: pv.particles,
    meaning: pv.meaning,
    definition: pv.definition,
    example: pv.example,
  }));
}

export function toPracticeExerciseBlock(params: {
  blockId: string;
  selectedPvs: PhrasalVerb[];
  exercise: PracticeExercise;
}): PracticeExerciseBlock {
  const selectedPvIds = params.selectedPvs.map((pv) => pv.id);
  const expectedCount = selectedPvIds.length;
  const allowedPvIdSet = new Set(selectedPvIds);
  const selectedPvTextById = new Map(
    params.selectedPvs.map((pv) => [pv.id, normalizeWord(pv.phrasalVerb)]),
  );

  const assertExpectedPhrasalVerb = (pvId: string, phrasalVerb: string): void => {
    if (selectedPvTextById.get(pvId) !== normalizeWord(phrasalVerb)) {
      throw new Error(`El ejercicio generado devolvió un phrasal verb inesperado para ${pvId}.`);
    }
  };

  if (params.exercise.exerciseType === 'read_and_mark_meaning') {
    const filtered = params.exercise.items.filter((item) => allowedPvIdSet.has(item.pvId));
    const ordered = reorderBySelectedIds(filtered, selectedPvIds);

    if (ordered.length !== expectedCount) {
      throw new Error('El bloque read_and_mark_meaning quedó incompleto.');
    }

    ordered.forEach((item) => {
      assertExpectedPhrasalVerb(item.pvId, item.phrasalVerb);
    });

    const block: ReadAndMarkMeaningBlock = {
      blockId: params.blockId,
      exerciseType: 'read_and_mark_meaning',
      title: params.exercise.title,
      instructions: params.exercise.instructions,
      items: ordered,
    };

    return block;
  }

  if (params.exercise.exerciseType === 'mark_sentences_correct') {
    const filtered = params.exercise.items.filter((item) => allowedPvIdSet.has(item.pvId));
    const ordered = reorderBySelectedIds(filtered, selectedPvIds);

    if (ordered.length !== expectedCount) {
      throw new Error('El bloque mark_sentences_correct quedó incompleto.');
    }

    ordered.forEach((item) => {
      assertExpectedPhrasalVerb(item.pvId, item.phrasalVerb);
    });

    const block: MarkSentencesCorrectBlock = {
      blockId: params.blockId,
      exerciseType: 'mark_sentences_correct',
      title: params.exercise.title,
      instructions: params.exercise.instructions,
      items: ordered,
    };

    return block;
  }

  const filtered = params.exercise.items.filter((item) => allowedPvIdSet.has(item.pvId));
  const ordered = reorderBySelectedIds(filtered, selectedPvIds);

  if (ordered.length !== expectedCount) {
    throw new Error('El bloque fill_in_gaps_drag_drop quedó incompleto.');
  }

  ordered.forEach((item) => {
    assertExpectedPhrasalVerb(item.pvId, item.phrasalVerb);
    const expectedPv = params.selectedPvs.find((pv) => pv.id === item.pvId);
    const allowedSegments = new Set(
      [expectedPv?.verb, ...(expectedPv?.particles ?? [])]
        .filter(Boolean)
        .map((entry) => normalizeWord(String(entry))),
    );

    if (!allowedSegments.has(normalizeWord(item.correctWord))) {
      throw new Error('Cada correctWord debe ser una sola parte del phrasal verb.');
    }
  });

  if (params.exercise.wordBank.length !== ordered.length) {
    throw new Error('El banco de palabras no coincide con los items del bloque fill gaps.');
  }

  const answersSet = new Set(ordered.map((item) => normalizeWord(item.correctWord)));
  const wordBankSet = new Set(params.exercise.wordBank.map((word) => normalizeWord(word)));

  if (answersSet.size !== ordered.length || wordBankSet.size !== ordered.length) {
    throw new Error('El banco de palabras contiene duplicados o respuestas repetidas.');
  }

  for (const word of wordBankSet) {
    if (!answersSet.has(word)) {
      throw new Error('El banco de palabras contiene opciones fuera de las respuestas correctas.');
    }
  }

  const block: FillInGapsDragDropBlock = {
    blockId: params.blockId,
    exerciseType: 'fill_in_gaps_drag_drop',
    title: params.exercise.title,
    instructions: params.exercise.instructions,
    items: ordered,
    wordBank: params.exercise.wordBank,
  };

  return block;
}

export async function generatePracticeBlockForIndex(
  params: GeneratePracticeBlockParams,
): Promise<PracticeExerciseBlock> {
  const plannedBlock = params.practicePlan[params.index];
  if (!plannedBlock) {
    throw new Error(`No existe un bloque planeado para el índice ${params.index}.`);
  }

  const existingBlock = params.practiceQueue.find((block) => block.blockId === plannedBlock.blockId);
  if (existingBlock) {
    return existingBlock;
  }

  const selectedPvs = plannedBlock.items.map((item) => item.pv);
  const exercise = await params.generateExercise({
    exerciseType: plannedBlock.exerciseType,
    phrasalVerbs: toPracticeExerciseInput(selectedPvs),
    recentUsage: buildRecentUsage(plannedBlock, params.practiceQueue),
  });

  return toPracticeExerciseBlock({
    blockId: plannedBlock.blockId,
    selectedPvs,
    exercise,
  });
}

export async function bootstrapPlannedPracticeSession(params: {
  sessionPvs: PhrasalVerb[];
  generateExercise: GeneratePracticeBlockParams['generateExercise'];
}): Promise<PlannedPracticeSession> {
  return {
    practicePlan: buildPracticeQueue(params.sessionPvs).blocks,
    practiceQueue: [],
  };
}
