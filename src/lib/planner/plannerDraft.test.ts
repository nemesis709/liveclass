import { describe, expect, it } from 'vitest';

import type { PlannerDraftBlockModel } from '../../model';
import {
  areDraftBlocksEqual,
  buildDraftSummary,
  toSavePlannerBlock,
} from './plannerDraft';

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

describe('planner draft utilities', () => {
  it('temp id는 저장 payload에서 제거합니다', () => {
    const block = createBlock({
      id: 'temp-123',
      startMinutes: 570,
      endMinutes: 630,
      memo: '복습',
    });

    expect(toSavePlannerBlock(block)).toEqual({
      id: undefined,
      courseId: 'course-1',
      dayOfWeek: 0,
      startTime: '09:30',
      endTime: '10:30',
      memo: '복습',
    });
  });

  it('블록 순서가 달라도 같은 draft면 동일하다고 판단합니다', () => {
    const first = createBlock({ id: 'block-1' });
    const second = createBlock({ id: 'block-2', dayOfWeek: 1 });

    expect(areDraftBlocksEqual([first, second], [second, first])).toBe(true);
  });

  it('초 단위가 아닌 분 단위로 요약 정보를 집계합니다', () => {
    const blocks = [
      createBlock({ id: 'block-1', courseId: 'course-1', dayOfWeek: 0, startMinutes: 540, endMinutes: 600 }),
      createBlock({ id: 'block-2', courseId: 'course-1', dayOfWeek: 0, startMinutes: 600, endMinutes: 660 }),
      createBlock({ id: 'block-3', courseId: 'course-2', dayOfWeek: 2, startMinutes: 660, endMinutes: 720 }),
    ];

    expect(buildDraftSummary(blocks)).toEqual({
      totalMinutes: 180,
      formattedTotal: '3h',
      byCourse: [
        { courseId: 'course-1', totalMinutes: 120 },
        { courseId: 'course-2', totalMinutes: 60 },
      ],
      byDay: [
        { dayOfWeek: 0, totalMinutes: 120 },
        { dayOfWeek: 2, totalMinutes: 60 },
      ],
    });
  });
});
