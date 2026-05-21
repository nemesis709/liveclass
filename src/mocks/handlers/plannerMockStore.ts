import {
  formatSummaryTotal,
  getConflictingBlockIdsByBlockId,
  toDraftBlock,
} from '../../lib/planner';
import {
  formatMinutesToTime,
  isAlignedToInterval,
  isValidTimeRange,
  parseTimeToMinutes,
} from '../../lib/time';
import type {
  PlannerCourseSummaryItemModel,
  PlannerDaySummaryItemModel,
  PlannerDraftResponseModel,
  PlannerErrorResponseModel,
  PlannerResponseModel,
  SavePlannerBlockRequestModel,
  SavePlannerDraftRequestModel,
  SavePlannerRequestModel,
} from '../../model/planner';
import { kPlannerDrafts, kSavedPlanners } from '../data/planners';

const kPlannerIntervalMinutes = 30;
const kPlannerStartMinutes = 8 * 60;
const kPlannerEndMinutes = 20 * 60;

const savedPlanners = new Map<string, PlannerResponseModel>(
  kSavedPlanners.map((planner) => [planner.weekStart, planner]),
);

const plannerDrafts = new Map<string, PlannerDraftResponseModel>(
  kPlannerDrafts.map((draft) => [draft.weekStart, draft]),
);

const buildSummary = (
  blocks: SavePlannerBlockRequestModel[],
): PlannerResponseModel['summary'] => {
  const byCourse = new Map<string, number>();
  const byDay = new Map<number, number>();

  const totalMinutes = blocks.reduce((accumulator, block) => {
    const duration =
      parseTimeToMinutes(block.endTime) - parseTimeToMinutes(block.startTime);

    byCourse.set(
      block.courseId,
      (byCourse.get(block.courseId) ?? 0) + duration,
    );
    byDay.set(
      block.dayOfWeek,
      (byDay.get(block.dayOfWeek) ?? 0) + duration,
    );

    return accumulator + duration;
  }, 0);

  const courseSummary: PlannerCourseSummaryItemModel[] = [...byCourse.entries()]
    .map(([courseId, totalMinutesByCourse]) => ({
      courseId,
      totalMinutes: totalMinutesByCourse,
    }));

  const daySummary: PlannerDaySummaryItemModel[] = [...byDay.entries()]
    .sort(([left], [right]) => left - right)
    .map(([dayOfWeek, totalMinutesByDay]) => ({
      dayOfWeek,
      totalMinutes: totalMinutesByDay,
    }));

  return {
    totalMinutes,
    formattedTotal: formatSummaryTotal(totalMinutes),
    byCourse: courseSummary,
    byDay: daySummary,
  };
};

const buildConflictError = (
  conflictBlockIds: string[],
): PlannerErrorResponseModel => ({
  code: 'TIME_CONFLICT',
  message: '시간이 겹치는 학습 블록이 있습니다',
  conflictBlockIds,
});

const buildInvalidRangeError = (): PlannerErrorResponseModel => ({
  code: 'INVALID_TIME_RANGE',
  message: '종료 시간은 시작 시간보다 뒤여야 합니다',
});

const buildInvalidBlockError = (): PlannerErrorResponseModel => ({
  code: 'INVALID_BLOCK',
  message: '학습 블록 데이터가 유효하지 않습니다',
});

const validateBlocks = (
  blocks: SavePlannerBlockRequestModel[],
): PlannerErrorResponseModel | null => {
  const draftBlocks = blocks.map((draftBlock, index) =>
    toDraftBlock({
      id: draftBlock.id ?? `temp-${index}`,
      courseId: draftBlock.courseId,
      dayOfWeek: draftBlock.dayOfWeek,
      startTime: draftBlock.startTime,
      endTime: draftBlock.endTime,
      memo: draftBlock.memo,
    }),
  );

  for (const block of blocks) {
    const startMinutes = parseTimeToMinutes(block.startTime);
    const endMinutes = parseTimeToMinutes(block.endTime);

    if (
      !isValidTimeRange(startMinutes, endMinutes) ||
      startMinutes < kPlannerStartMinutes ||
      endMinutes > kPlannerEndMinutes
    ) {
      return buildInvalidRangeError();
    }

    if (
      !isAlignedToInterval(startMinutes, kPlannerIntervalMinutes) ||
      !isAlignedToInterval(endMinutes, kPlannerIntervalMinutes)
    ) {
      return buildInvalidBlockError();
    }

    const blockId = block.id ?? draftBlocks[blocks.indexOf(block)]?.id;
    const conflictBlockIds = blockId
      ? getConflictingBlockIdsByBlockId(blockId, draftBlocks)
      : [];

    if (conflictBlockIds.length > 0) {
      return buildConflictError(conflictBlockIds);
    }
  }

  return null;
};

const normalizeBlocks = (
  blocks: SavePlannerBlockRequestModel[],
): PlannerResponseModel['blocks'] =>
  blocks.map((block) => ({
    id: block.id ?? crypto.randomUUID(),
    courseId: block.courseId,
    dayOfWeek: block.dayOfWeek,
    startTime: formatMinutesToTime(parseTimeToMinutes(block.startTime)),
    endTime: formatMinutesToTime(parseTimeToMinutes(block.endTime)),
    memo: block.memo,
  }));

export const plannerMockStore = {
  getPlanner(weekStart: string): PlannerResponseModel {
    return (
      savedPlanners.get(weekStart) ?? {
        weekStart,
        blocks: [],
        summary: {
          totalMinutes: 0,
          formattedTotal: '0m',
          byCourse: [],
          byDay: [],
        },
      }
    );
  },

  savePlanner(
    payload: SavePlannerRequestModel,
  ): PlannerResponseModel | PlannerErrorResponseModel {
    const validationError = validateBlocks(payload.blocks);
    if (validationError) {
      return validationError;
    }

    const normalizedBlocks = normalizeBlocks(payload.blocks);
    const planner: PlannerResponseModel = {
      weekStart: payload.weekStart,
      blocks: normalizedBlocks,
      summary: buildSummary(normalizedBlocks),
    };

    savedPlanners.set(payload.weekStart, planner);
    plannerDrafts.delete(payload.weekStart);

    return planner;
  },

  getPlannerDraft(weekStart: string): PlannerDraftResponseModel | null {
    return plannerDrafts.get(weekStart) ?? null;
  },

  savePlannerDraft(
    payload: SavePlannerDraftRequestModel,
  ): PlannerDraftResponseModel | PlannerErrorResponseModel {
    const validationError = validateBlocks(payload.blocks);
    if (validationError) {
      return validationError;
    }

    const draft: PlannerDraftResponseModel = {
      weekStart: payload.weekStart,
      blocks: normalizeBlocks(payload.blocks),
      updatedAt: new Date().toISOString(),
    };

    plannerDrafts.set(payload.weekStart, draft);

    return draft;
  },

  deletePlannerDraft(weekStart: string): void {
    plannerDrafts.delete(weekStart);
  },
};
