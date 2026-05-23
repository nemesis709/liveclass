import { describe, expect, it } from 'vitest';

import type { PlannerDraftBlockModel } from '../../model';
import {
  findConflictingBlockIds,
  getAllConflictingBlockIds,
  hasConflictingBlocks,
  isOverlappingBlock,
} from './plannerConflict';

const createBlock = (
  overrides: Partial<PlannerDraftBlockModel>,
): PlannerDraftBlockModel => ({
  id: 'block-1',
  courseId: 'course-1',
  dayOfWeek: 0,
  startMinutes: 540,
  endMinutes: 600,
  memo: '',
  ...overrides,
});

describe('planner conflict utilities', () => {
  it('인접 시간대는 충돌로 보지 않습니다', () => {
    const first = createBlock({ id: 'block-1', startMinutes: 540, endMinutes: 600 });
    const second = createBlock({ id: 'block-2', startMinutes: 600, endMinutes: 660 });

    expect(isOverlappingBlock(first, second)).toBe(false);
  });

  it('실제로 겹치는 시간대는 충돌로 판정합니다', () => {
    const first = createBlock({ id: 'block-1', startMinutes: 540, endMinutes: 630 });
    const second = createBlock({ id: 'block-2', startMinutes: 600, endMinutes: 660 });

    expect(isOverlappingBlock(first, second)).toBe(true);
    expect(findConflictingBlockIds(first, [first, second])).toEqual(['block-2']);
  });

  it('같은 요일에서 충돌하는 모든 블록 id를 모읍니다', () => {
    const first = createBlock({ id: 'block-1', startMinutes: 540, endMinutes: 630 });
    const second = createBlock({ id: 'block-2', startMinutes: 600, endMinutes: 660 });
    const third = createBlock({ id: 'block-3', dayOfWeek: 1, startMinutes: 600, endMinutes: 660 });

    expect(hasConflictingBlocks([first, second, third])).toBe(true);
    expect(getAllConflictingBlockIds([first, second, third]).sort()).toEqual([
      'block-1',
      'block-2',
    ]);
  });
});
