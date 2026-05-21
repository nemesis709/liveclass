import type {
  PlannerDraftBlockModel,
  PlannerDraftModel,
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
