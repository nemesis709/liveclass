export const queryKeys = {
  courses: ['courses'] as const,
  planner: (weekStart: string) => ['planner', weekStart] as const,
  plannerDraft: (weekStart: string) => ['planner-draft', weekStart] as const,
};
