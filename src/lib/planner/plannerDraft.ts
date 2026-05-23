import type {
  PlannerDraftBlockModel,
  PlannerDraftModel,
  PlannerSummaryModel,
  PlannerResponseModel,
  SavePlannerBlockRequestModel,
  StudyBlockModel,
} from '../../model/planner';
import {
  formatDuration,
  formatMinutesToTime,
  parseTimeToMinutes,
} from '../time';

export const toDraftBlock = (
  block: StudyBlockModel,
): PlannerDraftBlockModel => ({
  id: block.id,
  courseId: block.courseId,
  dayOfWeek: block.dayOfWeek,
  startMinutes: parseTimeToMinutes(block.startTime),
  endMinutes: parseTimeToMinutes(block.endTime),
  memo: block.memo ?? '',
});

export const toDraftModel = (
  planner: Pick<PlannerResponseModel, 'weekStart' | 'blocks'>,
): PlannerDraftModel => ({
  weekStart: planner.weekStart,
  blocks: planner.blocks.map(toDraftBlock),
});

export const toSavePlannerBlock = (
  block: PlannerDraftBlockModel,
): SavePlannerBlockRequestModel => ({
  id: block.id.startsWith('temp-') ? undefined : block.id,
  courseId: block.courseId,
  dayOfWeek: block.dayOfWeek,
  startTime: formatMinutesToTime(block.startMinutes),
  endTime: formatMinutesToTime(block.endMinutes),
  memo: block.memo || undefined,
});

export const formatSummaryTotal = (totalMinutes: number): string =>
  formatDuration(totalMinutes);

export const formatDraftBlockTimeRange = (
  block: PlannerDraftBlockModel,
): string =>
  `${formatMinutesToTime(block.startMinutes)} - ${formatMinutesToTime(block.endMinutes)}`;

export const areDraftBlocksEqual = (
  leftBlocks: PlannerDraftBlockModel[],
  rightBlocks: PlannerDraftBlockModel[],
): boolean => {
  if (leftBlocks.length !== rightBlocks.length) {
    return false;
  }

  const serialize = (block: PlannerDraftBlockModel) =>
    [
      block.id,
      block.courseId,
      block.dayOfWeek,
      block.startMinutes,
      block.endMinutes,
      block.memo,
    ].join('|');

  const leftSerialized = [...leftBlocks]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(serialize);
  const rightSerialized = [...rightBlocks]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map(serialize);

  return leftSerialized.every(
    (serializedBlock, index) => serializedBlock === rightSerialized[index],
  );
};

export const buildDraftSummary = (
  blocks: PlannerDraftBlockModel[],
): PlannerSummaryModel => {
  const byCourseMap = new Map<string, number>();
  const byDayMap = new Map<number, number>();

  const totalMinutes = blocks.reduce((totalMinutesSum, block) => {
    const duration = block.endMinutes - block.startMinutes;

    byCourseMap.set(
      block.courseId,
      (byCourseMap.get(block.courseId) ?? 0) + duration,
    );
    byDayMap.set(
      block.dayOfWeek,
      (byDayMap.get(block.dayOfWeek) ?? 0) + duration,
    );

    return totalMinutesSum + duration;
  }, 0);

  return {
    totalMinutes,
    formattedTotal: formatSummaryTotal(totalMinutes),
    byCourse: [...byCourseMap.entries()].map(([courseId, minutes]) => ({
      courseId,
      totalMinutes: minutes,
    })),
    byDay: [...byDayMap.entries()]
      .sort(([left], [right]) => left - right)
      .map(([dayOfWeek, minutes]) => ({
        dayOfWeek,
        totalMinutes: minutes,
      })),
  };
};
