import type {
  PlannerDraftResponseModel,
  PlannerResponseModel,
} from '../../model/planner';

export const kSavedPlanners: PlannerResponseModel[] = [
  {
    weekStart: '2026-05-18',
    blocks: [
      {
        id: 'block-1',
        courseId: 'course-react',
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '10:30',
        memo: '상태 관리 복습',
      },
      {
        id: 'block-2',
        courseId: 'course-ts',
        dayOfWeek: 2,
        startTime: '18:30',
        endTime: '19:30',
        memo: '고급 타입 읽기',
      },
      {
        id: 'block-3',
        courseId: 'course-next',
        dayOfWeek: 4,
        startTime: '19:00',
        endTime: '20:00',
      },
    ],
    summary: {
      totalMinutes: 240,
      formattedTotal: '4h',
      byCourse: [
        { courseId: 'course-react', totalMinutes: 90 },
        { courseId: 'course-ts', totalMinutes: 60 },
        { courseId: 'course-next', totalMinutes: 90 },
      ],
      byDay: [
        { dayOfWeek: 0, totalMinutes: 90 },
        { dayOfWeek: 2, totalMinutes: 60 },
        { dayOfWeek: 4, totalMinutes: 90 },
      ],
    },
  },
];

export const kPlannerDrafts: PlannerDraftResponseModel[] = [];
