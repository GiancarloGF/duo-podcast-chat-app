import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';
import type { SrsExerciseType } from '@/features/phrasal-verbs/domain/entities/PhrasalVerbSrs';

const EXERCISE_ORDER: SrsExerciseType[] = [
  'read_and_mark_meaning',
  'mark_sentences_correct',
  'fill_in_gaps_drag_drop',
];

export interface PracticeQueueItem {
  pv: PhrasalVerb;
}

export interface PracticeQueueBlock {
  blockId: string;
  exerciseType: SrsExerciseType;
  items: PracticeQueueItem[];
}

export interface BuildPracticeQueueResult {
  targetCount: number;
  blocks: PracticeQueueBlock[];
}

function pickForBlock(params: {
  phrasalVerbs: PhrasalVerb[];
  targetCount: number;
  usedInPreviousBlocks: Set<string>;
  usedInPreviousBlock: Set<string>;
}): PhrasalVerb[] {
  const picked: PhrasalVerb[] = [];
  const pickedIds = new Set<string>();

  const tryPick = (predicate: (pv: PhrasalVerb) => boolean): void => {
    for (const pv of params.phrasalVerbs) {
      if (picked.length >= params.targetCount) {
        break;
      }

      if (pickedIds.has(pv.id)) {
        continue;
      }

      if (!predicate(pv)) {
        continue;
      }

      picked.push(pv);
      pickedIds.add(pv.id);
    }
  };

  // 1) PVs no usados en bloques anteriores
  tryPick((pv) => !params.usedInPreviousBlocks.has(pv.id));

  // 2) PVs no usados en el bloque inmediatamente anterior
  tryPick((pv) => !params.usedInPreviousBlock.has(pv.id));

  // 3) Completar con cualquier PV si hace falta
  tryPick(() => true);

  return picked;
}

export function buildPracticeQueue(
  phrasalVerbs: PhrasalVerb[],
  maxItemsPerExercise = 5,
): BuildPracticeQueueResult {
  if (phrasalVerbs.length === 0) {
    return {
      targetCount: 0,
      blocks: [],
    };
  }

  const targetCount = Math.min(maxItemsPerExercise, phrasalVerbs.length);

  if (phrasalVerbs.length <= maxItemsPerExercise) {
    const selectedPvs = phrasalVerbs.slice(0, targetCount);

    return {
      targetCount,
      blocks: EXERCISE_ORDER.map((exerciseType, index) => ({
        blockId: `${exerciseType}-${index + 1}`,
        exerciseType,
        items: selectedPvs.map((pv) => ({ pv })),
      })),
    };
  }

  const usedInPreviousBlocks = new Set<string>();
  let usedInPreviousBlock = new Set<string>();

  const blocks: PracticeQueueBlock[] = EXERCISE_ORDER.map((exerciseType, index) => {
    const selectedPvs = pickForBlock({
      phrasalVerbs,
      targetCount,
      usedInPreviousBlocks,
      usedInPreviousBlock,
    });

    const selectedIds = new Set(selectedPvs.map((pv) => pv.id));
    selectedPvs.forEach((pv) => usedInPreviousBlocks.add(pv.id));
    usedInPreviousBlock = selectedIds;

    return {
      blockId: `${exerciseType}-${index + 1}`,
      exerciseType,
      items: selectedPvs.map((pv) => ({ pv })),
    };
  });

  return {
    targetCount,
    blocks,
  };
}
