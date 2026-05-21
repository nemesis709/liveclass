export interface StudyBlockModel {
  id: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  memo?: string;
}

export interface PlannerCourseSummaryItemModel {
  courseId: string;
  totalMinutes: number;
}

export interface PlannerDaySummaryItemModel {
  dayOfWeek: number;
  totalMinutes: number;
}

export interface PlannerSummaryModel {
  totalMinutes: number;
  byCourse: PlannerCourseSummaryItemModel[];
  byDay: PlannerDaySummaryItemModel[];
  formattedTotal?: string;
}

export interface PlannerResponseModel {
  weekStart: string;
  blocks: StudyBlockModel[];
  summary: PlannerSummaryModel;
}

export interface PlannerDraftResponseModel {
  weekStart: string;
  blocks: StudyBlockModel[];
  updatedAt: string;
}

export interface SavePlannerBlockRequestModel {
  id?: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  memo?: string;
}

export interface SavePlannerRequestModel {
  weekStart: string;
  blocks: SavePlannerBlockRequestModel[];
}

export interface SavePlannerDraftRequestModel {
  weekStart: string;
  blocks: SavePlannerBlockRequestModel[];
}

export type PlannerErrorCode =
  | 'TIME_CONFLICT'
  | 'INVALID_TIME_RANGE'
  | 'INVALID_BLOCK';

export interface PlannerErrorResponseModel {
  code: PlannerErrorCode;
  message: string;
  conflictBlockIds?: string[];
}
