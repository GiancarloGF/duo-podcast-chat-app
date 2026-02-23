import { describe, expect, it } from 'vitest';
import { buildPracticeQueue } from '@/features/phrasal-verbs/application/usecases/BuildPracticeQueue.usecase';
import type { PhrasalVerb } from '@/features/phrasal-verbs/domain/entities/PhrasalVerb';

function makePv(index: number): PhrasalVerb {
  return {
    id: `pv-${index}`,
    phrasalVerb: `verb ${index}`,
    verb: 'verb',
    particles: ['up'],
    superGroup: 'A',
    group: 'G',
    category: 'C',
    meaning: 'meaning',
    definition: 'definition',
    example: 'example',
    commonUsage: '',
    transitivity: '',
    separability: '',
    imageUrl: '',
    synonyms: [],
    nativeNotes: [],
    createdAt: null,
  };
}

describe('buildPracticeQueue', () => {
  it('repeats the same 5 PVs across the 3 blocks when session has 5 PVs', () => {
    const pvs = Array.from({ length: 5 }, (_, i) => makePv(i + 1));
    const result = buildPracticeQueue(pvs);
    const block1Ids = result.blocks[0]?.items.map((item) => item.pv.id) ?? [];
    const block2Ids = result.blocks[1]?.items.map((item) => item.pv.id) ?? [];
    const block3Ids = result.blocks[2]?.items.map((item) => item.pv.id) ?? [];

    expect(result.blocks).toHaveLength(3);
    expect(result.blocks[0]?.exerciseType).toBe('read_and_mark_meaning');
    expect(result.blocks[1]?.exerciseType).toBe('mark_sentences_correct');
    expect(result.blocks[2]?.exerciseType).toBe('fill_in_gaps_drag_drop');
    expect(block2Ids).toEqual(block1Ids);
    expect(block3Ids).toEqual(block1Ids);

    result.blocks.forEach((block) => {
      expect(block.items).toHaveLength(5);
    });
  });

  it('for 6 PVs keeps 5 items per block and allows repetition to complete blocks', () => {
    const pvs = Array.from({ length: 6 }, (_, i) => makePv(i + 1));
    const result = buildPracticeQueue(pvs);

    const covered = new Set(
      result.blocks.flatMap((block) => block.items.map((item) => item.pv.id)),
    );
    const block1Ids = new Set(result.blocks[0]?.items.map((item) => item.pv.id));
    const block2Ids = new Set(result.blocks[1]?.items.map((item) => item.pv.id));
    const overlap12 = Array.from(block1Ids).filter((id) => block2Ids.has(id));

    expect(result.blocks).toHaveLength(3);
    expect(result.targetCount).toBe(5);
    expect(covered.size).toBe(6);
    expect(overlap12.length).toBeGreaterThan(0);
    result.blocks.forEach((block) => {
      expect(block.items).toHaveLength(5);
    });
  });

  it('covers all 8 PVs at least once when session has 8 PVs', () => {
    const pvs = Array.from({ length: 8 }, (_, i) => makePv(i + 1));
    const result = buildPracticeQueue(pvs);

    const covered = new Set(
      result.blocks.flatMap((block) => block.items.map((item) => item.pv.id)),
    );

    expect(result.blocks).toHaveLength(3);
    expect(result.targetCount).toBe(5);
    expect(covered.size).toBe(8);
    result.blocks.forEach((block) => {
      expect(block.items).toHaveLength(5);
    });
  });

  it('covers all 10 PVs at least once and minimizes early repetition', () => {
    const pvs = Array.from({ length: 10 }, (_, i) => makePv(i + 1));
    const result = buildPracticeQueue(pvs);

    const covered = new Set(
      result.blocks.flatMap((block) => block.items.map((item) => item.pv.id)),
    );

    const block1Ids = new Set(result.blocks[0]?.items.map((item) => item.pv.id));
    const block2Ids = new Set(result.blocks[1]?.items.map((item) => item.pv.id));
    const overlap12 = Array.from(block1Ids).filter((id) => block2Ids.has(id));

    expect(result.blocks).toHaveLength(3);
    expect(covered.size).toBe(10);
    expect(overlap12).toHaveLength(0);
    result.blocks.forEach((block) => {
      expect(block.items).toHaveLength(5);
    });
  });
});
