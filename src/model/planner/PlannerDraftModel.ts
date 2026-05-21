export interface PlannerDraftBlockModel {
  id: string;
  courseId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  memo: string;
}

export interface PlannerDraftModel {
  weekStart: string;
  blocks: PlannerDraftBlockModel[];
}

export interface PlannerBlockFormValueModel {
  id?: string;
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  memo: string;
}
