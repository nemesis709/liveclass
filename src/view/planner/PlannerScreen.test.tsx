/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import { createElement } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  PlannerDraftResponseModel,
  PlannerResponseModel,
} from '../../model/planner';
import type { CourseListResponseModel } from '../../model/course';
import { useCoursesViewModel, usePlannerViewModel } from '../../view-model/planner';
import { PlannerScreen } from './PlannerScreen';

vi.mock('../../view-model/planner', () => ({
  useCoursesViewModel: vi.fn(),
  usePlannerViewModel: vi.fn(),
}));

const mockedUseCoursesViewModel = vi.mocked(useCoursesViewModel);
const mockedUsePlannerViewModel = vi.mocked(usePlannerViewModel);

const kCourses: CourseListResponseModel = {
  courses: [
    { id: 'course-1', title: '리액트 심화', color: '#4A90D9' },
    { id: 'course-2', title: '자료구조', color: '#D97A4A' },
  ],
};

const createPlannerResponse = (
  overrides: Partial<PlannerResponseModel>,
): PlannerResponseModel => ({
  weekStart: '2026-05-18',
  blocks: [],
  summary: {
    totalMinutes: 0,
    formattedTotal: '0m',
    byCourse: [],
    byDay: [],
  },
  ...overrides,
});

const createDraftResponse = (
  overrides: Partial<PlannerDraftResponseModel>,
): PlannerDraftResponseModel => ({
  weekStart: '2026-05-18',
  blocks: [],
  updatedAt: '2026-05-23T00:00:00.000Z',
  ...overrides,
});

const buildPlannerViewModelMock = ({
  planner,
  draft,
}: {
  planner: PlannerResponseModel;
  draft: PlannerDraftResponseModel | null;
}) =>
  ({
    plannerQuery: {
      data: planner,
      isLoading: false,
      isFetching: false,
      error: null,
    },
    plannerDraftQuery: {
      data: draft,
      isLoading: false,
      isFetching: false,
      error: null,
    },
    savePlannerMutation: {
      isPending: false,
      isError: false,
      isSuccess: false,
      mutateAsync: vi.fn(),
    },
    savePlannerDraftMutation: {
      isPending: false,
      mutateAsync: vi.fn(),
    },
  }) as unknown as ReturnType<typeof usePlannerViewModel>;

const buildCoursesViewModelMock = () =>
  ({
    data: kCourses,
    isLoading: false,
    error: null,
  }) as unknown as ReturnType<typeof useCoursesViewModel>;

describe('PlannerScreen', () => {
  beforeEach(() => {
    mockedUseCoursesViewModel.mockReturnValue(buildCoursesViewModelMock());
  });

  it('충돌하는 블록이 있으면 저장 버튼을 비활성화하고 경고를 표시합니다', () => {
    mockedUsePlannerViewModel.mockReturnValue(
      buildPlannerViewModelMock({
        planner: createPlannerResponse({}),
        draft: createDraftResponse({
          blocks: [
            {
              id: 'block-1',
              courseId: 'course-1',
              dayOfWeek: 0,
              startTime: '09:00',
              endTime: '10:00',
            },
            {
              id: 'block-2',
              courseId: 'course-2',
              dayOfWeek: 0,
              startTime: '09:30',
              endTime: '10:30',
            },
          ],
        }),
      }),
    );

    render(createElement(PlannerScreen));

    expect(
      screen.getByText('겹치는 학습 블록이 있습니다. 충돌을 해소해야 최종 저장할 수 있습니다.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '저장하기' })).toBeDisabled();
  });

  it('그리드 위 요일 헤더를 누르면 요일 선택 모달이 열리고 닫힙니다', async () => {
    const user = userEvent.setup();

    mockedUsePlannerViewModel.mockReturnValue(
      buildPlannerViewModelMock({
        planner: createPlannerResponse({}),
        draft: null,
      }),
    );

    const { container } = render(createElement(PlannerScreen));

    const dayHeaderButton = container.querySelector<HTMLButtonElement>(
      '.planner-grid__day-button',
    );

    expect(dayHeaderButton).not.toBeNull();

    await user.click(dayHeaderButton!);

    const dialog = screen.getByRole('dialog', { name: '요일 선택' });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: '수' }));

    expect(screen.queryByRole('dialog', { name: '요일 선택' })).not.toBeInTheDocument();
  });
});
