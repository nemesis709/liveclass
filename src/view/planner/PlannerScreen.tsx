'use client';

import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import {
  areDraftBlocksEqual,
  buildDraftSummary,
  formatDraftBlockTimeRange,
  getAllConflictingBlockIds,
  toDraftModel,
  toSavePlannerBlock,
} from '../../lib/planner';
import {
  formatDuration,
  formatMinutesToTime,
  isValidTimeRange,
  parseTimeToMinutes,
} from '../../lib/time';
import type {
  CourseModel,
  PlannerDraftBlockModel,
  PlannerBlockFormValueModel,
  PlannerSummaryModel,
} from '../../model';
import { useCoursesViewModel, usePlannerViewModel } from '../../view-model/planner';
import { PlannerBlockModal } from './PlannerBlockModal';

const kDays = ['월', '화', '수', '목', '금', '토', '일'];
const kGridStartMinutes = 8 * 60;
const kGridEndMinutes = 20 * 60;
const kSlotMinutes = 30;
const kDefaultBlockDuration = 30;
const kSlotHeightPixels = 30;
const kPixelsPerMinute = kSlotHeightPixels / kSlotMinutes;

const buildGridSlots = (): string[] => {
  const slots: string[] = [];

  for (let minutes = kGridStartMinutes; minutes < kGridEndMinutes; minutes += kSlotMinutes) {
    const hours = Math.floor(minutes / 60);
    const remainedMinutes = minutes % 60;

    slots.push(
      `${String(hours).padStart(2, '0')}:${String(remainedMinutes).padStart(2, '0')}`,
    );
  }

  return slots;
};

const buildTimeLabelOffsets = (): Array<{ label: string; top: number }> => {
  const labels: Array<{ label: string; top: number }> = [];

  for (let minutes = kGridStartMinutes; minutes <= kGridEndMinutes; minutes += 60) {
    labels.push({
      label: formatMinutesToTime(minutes),
      top: (minutes - kGridStartMinutes) * kPixelsPerMinute,
    });
  }

  return labels;
};

const toDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const getWeekStartByDate = (date: Date): string => {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  local.setDate(local.getDate() + diff);

  return toDateString(local);
};

const getCurrentWeekStart = (): string => getWeekStartByDate(new Date());

const getCurrentPlannerDay = (): number => {
  const day = new Date().getDay();

  return day === 0 ? 6 : day - 1;
};

const addWeeks = (weekStart: string, offset: number): string => {
  const [year, month, day] = weekStart.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + offset * 7);

  return toDateString(nextDate);
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const snapMinutesToSlot = (minutes: number): number =>
  Math.round(minutes / kSlotMinutes) * kSlotMinutes;

const replaceBlock = (
  blocks: PlannerDraftBlockModel[],
  nextBlock: PlannerDraftBlockModel,
): PlannerDraftBlockModel[] =>
  blocks.map((block) => (block.id === nextBlock.id ? nextBlock : block));

interface DragState {
  blockId: string;
  durationMinutes: number;
  originDayOfWeek: number;
  allowCrossDay: boolean;
  startClientX: number;
  startClientY: number;
  pointerOffsetY: number;
}

const getBlockStyle = (block: PlannerDraftBlockModel) => {
  const top = (block.startMinutes - kGridStartMinutes) * kPixelsPerMinute;
  const height = (block.endMinutes - block.startMinutes) * kPixelsPerMinute;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

const getBlockDurationMinutes = (block: PlannerDraftBlockModel): number =>
  block.endMinutes - block.startMinutes;

const getBlockDisplayMode = (
  block: PlannerDraftBlockModel,
): 'compact' | 'comfortable' | 'detailed' => {
  const durationMinutes = getBlockDurationMinutes(block);

  if (durationMinutes <= 30) {
    return 'compact';
  }

  if (durationMinutes <= 60) {
    return 'comfortable';
  }

  return 'detailed';
};

const buildFormValueFromSlot = (
  dayOfWeek: number,
  startTime: string,
): PlannerBlockFormValueModel => ({
  courseId: '',
  dayOfWeek,
  startTime,
  endTime: formatMinutesToTime(
    parseTimeToMinutes(startTime) + kDefaultBlockDuration,
  ),
  memo: '',
});

const buildFormValueFromDraftBlock = (
  block: PlannerDraftBlockModel,
): PlannerBlockFormValueModel => ({
  id: block.id,
  courseId: block.courseId,
  dayOfWeek: block.dayOfWeek,
  startTime: formatMinutesToTime(block.startMinutes),
  endTime: formatMinutesToTime(block.endMinutes),
  memo: block.memo,
});

const buildDraftBlockFromForm = (
  formValue: PlannerBlockFormValueModel,
): PlannerDraftBlockModel => ({
  id: formValue.id ?? `temp-${crypto.randomUUID()}`,
  courseId: formValue.courseId,
  dayOfWeek: formValue.dayOfWeek,
  startMinutes: parseTimeToMinutes(formValue.startTime),
  endMinutes: parseTimeToMinutes(formValue.endTime),
  memo: formValue.memo,
});

const findCourse = (
  courses: CourseModel[],
  courseId: string,
): CourseModel | undefined => courses.find((course) => course.id === courseId);

const PlannerSummarySection = ({
  summary,
  courses,
}: {
  summary: PlannerSummaryModel;
  courses: CourseModel[];
}) => (
  <section className="planner-summary">
    <div className="planner-summary__total">
      <span>총 학습 시간</span>
      <strong>{summary.formattedTotal ?? formatDuration(summary.totalMinutes)}</strong>
    </div>

    <div className="planner-summary__group">
      <span className="planner-summary__label">강의별 배분</span>
      <ul className="planner-summary__list">
        {summary.byCourse.map((item) => (
          <li key={item.courseId} className="planner-summary__item">
            <span className="planner-summary__item-title">
              <em
                className="summary-dot"
                style={{ backgroundColor: findCourse(courses, item.courseId)?.color }}
              />
              {findCourse(courses, item.courseId)?.title ?? item.courseId}
            </span>
            <strong>{formatDuration(item.totalMinutes)}</strong>
          </li>
        ))}
      </ul>
    </div>

    <div className="planner-summary__group">
      <span className="planner-summary__label">요일별 배분</span>
      <ul className="planner-summary__list">
        {summary.byDay.map((item) => (
          <li key={item.dayOfWeek} className="planner-summary__item">
            <span className="planner-summary__item-title">{kDays[item.dayOfWeek]}</span>
            <strong>{formatDuration(item.totalMinutes)}</strong>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export const PlannerScreen = () => {
  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStart());
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(
    getCurrentPlannerDay(),
  );
  const [isMobileDayModalOpen, setIsMobileDayModalOpen] = useState(false);
  const {
    plannerQuery,
    plannerDraftQuery,
    savePlannerMutation,
    savePlannerDraftMutation,
  } = usePlannerViewModel(weekStart);
  const coursesQuery = useCoursesViewModel();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [draftBlocks, setDraftBlocks] = useState<PlannerDraftBlockModel[]>([]);
  const [dragPreviewBlock, setDragPreviewBlock] = useState<PlannerDraftBlockModel | null>(
    null,
  );
  const [formValue, setFormValue] = useState<PlannerBlockFormValueModel | null>(null);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);

  const courses = coursesQuery.data?.courses ?? [];
  const savedPlanner = plannerQuery.data;
  const draftPlanner = plannerDraftQuery.data;
  const activePlanner = draftPlanner ?? savedPlanner;
  const effectiveBlocks = dragPreviewBlock
    ? replaceBlock(draftBlocks, dragPreviewBlock)
    : draftBlocks;
  const summary = buildDraftSummary(effectiveBlocks);
  const gridSlots = buildGridSlots();
  const timeLabels = buildTimeLabelOffsets();
  const conflictingBlockIds = getAllConflictingBlockIds(effectiveBlocks);
  const conflictingBlockIdSet = new Set(conflictingBlockIds);
  const savedDraftBlocks = savedPlanner ? toDraftModel(savedPlanner).blocks : [];
  const isDirty = !areDraftBlocksEqual(effectiveBlocks, savedDraftBlocks);
  const hasConflicts = conflictingBlockIds.length > 0;
  const isSavingPlanner = savePlannerMutation.isPending;
  const isDragging = dragPreviewBlock !== null;
  const isWeekFetching =
    (plannerQuery.isFetching || plannerDraftQuery.isFetching) &&
    !plannerQuery.isLoading &&
    !plannerDraftQuery.isLoading;
  const saveButtonLabel = isSavingPlanner
    ? '저장 중'
    : isDirty
      ? '저장하기'
      : '저장 완료';

  useEffect(() => {
    if (!activePlanner) {
      setDraftBlocks([]);
      setDragPreviewBlock(null);
      return;
    }

    setDraftBlocks(toDraftModel(activePlanner).blocks);
    setDragPreviewBlock(null);
  }, [activePlanner]);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  useEffect(() => {
    if (!isDragging) {
      document.body.style.userSelect = '';
      return undefined;
    }

    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const handleFormChange = (
    key: keyof PlannerBlockFormValueModel,
    value: string | number,
  ) => {
    setFormValue((previous) =>
      previous
        ? {
            ...previous,
            [key]: value,
          }
        : previous,
    );
  };

  const handleOpenCreateModal = (dayOfWeek: number, startTime: string) => {
    setModalErrorMessage(null);
    setFormValue(buildFormValueFromSlot(dayOfWeek, startTime));
  };

  const handleOpenEditModal = (block: PlannerDraftBlockModel) => {
    setModalErrorMessage(null);
    setFormValue(buildFormValueFromDraftBlock(block));
  };

  const handleCloseModal = () => {
    setModalErrorMessage(null);
    setFormValue(null);
  };

  const handleSaveDraft = async (
    nextDraftBlocks: PlannerDraftBlockModel[],
  ) => {
    setDraftBlocks(nextDraftBlocks);

    await savePlannerDraftMutation.mutateAsync({
      weekStart,
      blocks: nextDraftBlocks.map(toSavePlannerBlock),
    });
  };

  const handleDeleteBlock = async () => {
    if (!formValue?.id) {
      return;
    }

    const shouldDelete = window.confirm('이 학습 블록을 삭제할까요?');
    if (!shouldDelete) {
      return;
    }

    const nextDraftBlocks = draftBlocks.filter((block) => block.id !== formValue.id);

    try {
      await handleSaveDraft(nextDraftBlocks);
      handleCloseModal();
    } catch {
      setModalErrorMessage('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const resolveDraggedDayOfWeek = (
    clientX: number,
    fallbackDayOfWeek: number,
  ): number => {
    const gridElement = gridRef.current;

    if (!gridElement) {
      return fallbackDayOfWeek;
    }

    const columnElements = [
      ...gridElement.querySelectorAll<HTMLElement>('.planner-grid__column[data-day-index]'),
    ].filter((element) => getComputedStyle(element).display !== 'none');

    const hoveredColumn = columnElements.find((element) => {
      const rect = element.getBoundingClientRect();

      return clientX >= rect.left && clientX <= rect.right;
    });

    if (hoveredColumn) {
      return Number(hoveredColumn.dataset.dayIndex);
    }

    let nearestDayOfWeek = fallbackDayOfWeek;
    let nearestDistance = Number.POSITIVE_INFINITY;

    columnElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const distance = Math.abs(clientX - centerX);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestDayOfWeek = Number(element.dataset.dayIndex);
      }
    });

    return nearestDayOfWeek;
  };

  const buildPreviewBlockFromPointer = (
    event: PointerEvent,
  ): PlannerDraftBlockModel | null => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return null;
    }

    const currentBlock = draftBlocks.find((block) => block.id === dragState.blockId);

    if (!currentBlock) {
      return null;
    }

    const nextDayOfWeek = dragState.allowCrossDay
      ? resolveDraggedDayOfWeek(event.clientX, dragState.originDayOfWeek)
      : dragState.originDayOfWeek;

    const columnElement = gridRef.current?.querySelector<HTMLElement>(
      `.planner-grid__column[data-day-index="${nextDayOfWeek}"]`,
    );

    if (!columnElement) {
      return null;
    }

    const columnRect = columnElement.getBoundingClientRect();
    const maxTop = columnRect.height - dragState.durationMinutes * kPixelsPerMinute;
    const relativeY = clamp(
      event.clientY - columnRect.top - dragState.pointerOffsetY,
      0,
      maxTop,
    );
    const rawStartMinutes = kGridStartMinutes + relativeY / kPixelsPerMinute;
    const snappedStartMinutes = clamp(
      snapMinutesToSlot(rawStartMinutes),
      kGridStartMinutes,
      kGridEndMinutes - dragState.durationMinutes,
    );

    return {
      ...currentBlock,
      dayOfWeek: nextDayOfWeek,
      startMinutes: snappedStartMinutes,
      endMinutes: snappedStartMinutes + dragState.durationMinutes,
    };
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const movedDistanceX = Math.abs(event.clientX - dragState.startClientX);
      const movedDistanceY = Math.abs(event.clientY - dragState.startClientY);
      const hasExceededDragThreshold =
        movedDistanceX > 6 || movedDistanceY > 6 || dragPreviewBlock !== null;

      if (!hasExceededDragThreshold) {
        return;
      }

      const nextPreviewBlock = buildPreviewBlockFromPointer(event);

      if (!nextPreviewBlock) {
        return;
      }

      setDragPreviewBlock(nextPreviewBlock);
    };

    const handlePointerUp = async () => {
      const dragState = dragStateRef.current;

      if (!dragState) {
        return;
      }

      const nextPreviewBlock = dragPreviewBlock;
      dragStateRef.current = null;

      const currentBlock = draftBlocks.find((block) => block.id === dragState.blockId);

      if (!nextPreviewBlock) {
        if (currentBlock) {
          handleOpenEditModal(currentBlock);
        }

        setDragPreviewBlock(null);
        return;
      }

      setDragPreviewBlock(null);

      if (!currentBlock) {
        return;
      }

      if (
        currentBlock.dayOfWeek === nextPreviewBlock.dayOfWeek &&
        currentBlock.startMinutes === nextPreviewBlock.startMinutes
      ) {
        return;
      }

      const nextDraftBlocks = replaceBlock(draftBlocks, nextPreviewBlock).sort(
        (left, right) => {
          if (left.dayOfWeek !== right.dayOfWeek) {
            return left.dayOfWeek - right.dayOfWeek;
          }

          return left.startMinutes - right.startMinutes;
        },
      );

      try {
        await handleSaveDraft(nextDraftBlocks);
      } catch {
        // 기존 draft 저장 실패 정책과 동일하게 화면 메시지는 별도 저장 플로우에서 처리합니다.
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [dragPreviewBlock, draftBlocks]);

  const handleBlockPointerDown = (
    event: ReactPointerEvent<HTMLElement>,
    block: PlannerDraftBlockModel,
  ) => {
    event.preventDefault();

    const isMobileInteraction =
      window.matchMedia('(max-width: 960px)').matches || event.pointerType === 'touch';

    dragStateRef.current = {
      blockId: block.id,
      durationMinutes: getBlockDurationMinutes(block),
      originDayOfWeek: block.dayOfWeek,
      allowCrossDay: !isMobileInteraction,
      startClientX: event.clientX,
      startClientY: event.clientY,
      pointerOffsetY: event.clientY - event.currentTarget.getBoundingClientRect().top,
    };
  };

  const handleSavePlanner = async () => {
    if (hasConflicts) {
      return;
    }

    try {
      await savePlannerMutation.mutateAsync({
        weekStart,
        blocks: draftBlocks.map(toSavePlannerBlock),
      });
    } catch {
      // 저장 에러는 mutation 상태로 화면에 표시합니다.
    }
  };

  const handleChangeWeek = (offset: number) => {
    if (isDirty) {
      const shouldMove = window.confirm(
        '저장되지 않은 변경 사항이 있습니다. 다른 주차로 이동할까요?',
      );

      if (!shouldMove) {
        return;
      }
    }

    setWeekStart((currentWeekStart) => addWeeks(currentWeekStart, offset));
  };

  const handleSubmitBlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValue) {
      return;
    }

    if (!formValue.courseId) {
      setModalErrorMessage('강의를 선택해주세요.');
      return;
    }

    const nextDraftBlock = buildDraftBlockFromForm(formValue);

    if (!isValidTimeRange(nextDraftBlock.startMinutes, nextDraftBlock.endMinutes)) {
      setModalErrorMessage('종료 시간은 시작 시간보다 뒤여야 합니다.');
      return;
    }

    const nextDraftBlocks = [
      ...draftBlocks.filter((block) => block.id !== nextDraftBlock.id),
      nextDraftBlock,
    ].sort((left, right) => {
      if (left.dayOfWeek !== right.dayOfWeek) {
        return left.dayOfWeek - right.dayOfWeek;
      }

      return left.startMinutes - right.startMinutes;
    });

    try {
      await handleSaveDraft(nextDraftBlocks);
      handleCloseModal();
    } catch {
      setModalErrorMessage('draft 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (
    (!savedPlanner && plannerQuery.isLoading) ||
    coursesQuery.isLoading ||
    (!draftPlanner && plannerDraftQuery.isLoading && !savedPlanner)
  ) {
    return (
      <main className="page">
        <section className="planner-shell">
          <p className="planner-status">플래너를 불러오는 중입니다...</p>
        </section>
      </main>
    );
  }

  if (plannerQuery.error || coursesQuery.error || plannerDraftQuery.error) {
    return (
      <main className="page">
        <section className="planner-shell">
          <p className="planner-status planner-status--error">
            데이터를 불러오지 못했습니다. API 연결 상태를 확인해주세요.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="planner-shell">
        <header className="planner-header">
          <div>
            <p className="eyebrow">LiveClass Assignment</p>
            <h1>Weekly Study Planner</h1>
          </div>
          <div className="planner-badge-group">
            <button
              type="button"
              className={`planner-button planner-button--save ${
                isDirty ? '' : 'planner-button--success'
              }`}
              disabled={!isDirty || isSavingPlanner || hasConflicts}
              onClick={handleSavePlanner}
            >
              {isSavingPlanner ? (
                <>
                  <span className="planner-spinner" />
                  {saveButtonLabel}
                </>
              ) : (
                saveButtonLabel
              )}
            </button>
          </div>
        </header>

        <section className="planner-toolbar">
          <div className="planner-week-switcher">
            <button
              type="button"
              className="planner-button planner-button--ghost"
              onClick={() => handleChangeWeek(-1)}
            >
              이전 주
            </button>
            <strong>{weekStart}</strong>
            <button
              type="button"
              className="planner-button planner-button--ghost"
              onClick={() => handleChangeWeek(1)}
            >
              다음 주
            </button>
          </div>
          <p className="planner-toolbar__hint">
            빈 슬롯을 눌러 일정을 추가하고, 등록된 블록을 눌러 수정 또는 삭제할 수 있습니다.
          </p>
        </section>

        {savePlannerMutation.isError ? (
          <p className="planner-inline-message planner-inline-message--error">
            저장에 실패했습니다. 잠시 후 다시 시도해주세요.
          </p>
        ) : null}
        {hasConflicts ? (
          <p className="planner-inline-message planner-inline-message--error">
            겹치는 학습 블록이 있습니다. 충돌을 해소해야 최종 저장할 수 있습니다.
          </p>
        ) : null}
        {savePlannerMutation.isSuccess && !isDirty ? (
          <p className="planner-inline-message">최종 저장이 완료되었습니다.</p>
        ) : null}

        {summary ? (
          <PlannerSummarySection summary={summary} courses={courses} />
        ) : null}

        <section className="planner-board">
          {isWeekFetching ? (
            <div className="planner-fetching-overlay" aria-live="polite">
              <span className="planner-spinner planner-spinner--accent" />
              <span>불러오는 중...</span>
            </div>
          ) : null}
          {draftBlocks.length === 0 ? (
            <div className="planner-empty-state">
              <strong>아직 등록된 학습 블록이 없습니다.</strong>
              <p>원하는 요일과 시간을 눌러 첫 번째 학습 일정을 추가해보세요.</p>
            </div>
          ) : null}
          <div
            ref={gridRef}
            className={`planner-grid ${isDragging ? 'planner-grid--dragging' : ''}`}
          >
            <div className="planner-grid__corner" />
            {kDays.map((day, dayIndex) => (
              <button
                key={day}
                type="button"
                className={`planner-grid__day planner-grid__day-button ${
                  selectedMobileDay !== dayIndex
                    ? 'planner-grid__day--mobile-hidden'
                    : ''
                }`}
                onClick={() => setIsMobileDayModalOpen(true)}
              >
                <span>{day}</span>
                <span className="planner-grid__day-caret" aria-hidden="true">
                  ▾
                </span>
              </button>
            ))}

            <div className="planner-grid__times">
              {timeLabels.map((timeLabel) => (
                <div
                  key={timeLabel.label}
                  className="planner-grid__time"
                  style={{ top: `${timeLabel.top}px` }}
                >
                  {timeLabel.label}
                </div>
              ))}
            </div>

            {kDays.map((day, dayIndex) => (
              <div
                key={day}
                data-day-index={dayIndex}
                className={`planner-grid__column ${
                  selectedMobileDay !== dayIndex
                    ? 'planner-grid__column--mobile-hidden'
                    : ''
                }`}
              >
                {gridSlots.map((time, index) => (
                  <button
                    key={`${day}-${time}`}
                    type="button"
                    className={`planner-grid__cell planner-grid__cell--button ${
                      index % 2 === 1
                        ? 'planner-grid__cell--hour'
                        : 'planner-grid__cell--half'
                    }`}
                    onClick={() => handleOpenCreateModal(dayIndex, time)}
                    aria-label={`${day} ${time}에 학습 블록 추가`}
                  />
                ))}
                {effectiveBlocks
                  .filter((block) => block.dayOfWeek === dayIndex)
                  .map((block) => {
                    const course = findCourse(courses, block.courseId);
                    const displayMode = getBlockDisplayMode(block);
                    const shouldShowTime = displayMode !== 'compact';
                    const shouldShowMemo =
                      displayMode === 'detailed' && Boolean(block.memo);
                    const blockTitle = [
                      course?.title ?? block.courseId,
                      formatDraftBlockTimeRange(block),
                      block.memo,
                    ]
                      .filter(Boolean)
                      .join('\n');

                    return (
                      <article
                        key={block.id}
                        className={`planner-block planner-block--${displayMode} ${
                          dragPreviewBlock?.id === block.id
                            ? 'planner-block--dragging'
                            : ''
                        } ${
                          conflictingBlockIdSet.has(block.id)
                            ? 'planner-block--conflict'
                            : ''
                        }`}
                        onPointerDown={(event) => handleBlockPointerDown(event, block)}
                        title={blockTitle}
                        style={{
                          ...getBlockStyle(block),
                          backgroundColor: `${course?.color ?? '#1f7a8c'}22`,
                          borderColor: course?.color ?? '#1f7a8c',
                        }}
                      >
                        <strong>{course?.title ?? block.courseId}</strong>
                        {shouldShowTime ? (
                          <span>{formatDraftBlockTimeRange(block)}</span>
                        ) : null}
                        {shouldShowMemo ? <p>{block.memo}</p> : null}
                      </article>
                    );
                  })}
              </div>
            ))}
          </div>
        </section>
      </section>
      {formValue ? (
        <PlannerBlockModal
          courses={courses}
          formValue={formValue}
          isSaving={savePlannerDraftMutation.isPending}
          isDeleting={savePlannerDraftMutation.isPending}
          canDelete={Boolean(formValue.id)}
          errorMessage={modalErrorMessage}
          onChange={handleFormChange}
          onDelete={handleDeleteBlock}
          onClose={handleCloseModal}
          onSubmit={handleSubmitBlock}
        />
      ) : null}
      {isMobileDayModalOpen ? (
        <div
          className="planner-day-modal-backdrop"
          role="presentation"
          onClick={() => setIsMobileDayModalOpen(false)}
        >
          <div
            className="planner-day-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="planner-day-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="planner-day-modal__header">
              <div>
                <p className="planner-modal__eyebrow">Mobile View</p>
                <h2 id="planner-day-modal-title">요일 선택</h2>
              </div>
              <button
                type="button"
                className="planner-modal__close"
                onClick={() => setIsMobileDayModalOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="planner-day-modal__list">
              {kDays.map((day, dayIndex) => (
                <button
                  key={day}
                  type="button"
                  className={`planner-day-modal__option ${
                    selectedMobileDay === dayIndex
                      ? 'planner-day-modal__option--active'
                      : ''
                  }`}
                  onClick={() => {
                    setSelectedMobileDay(dayIndex);
                    setIsMobileDayModalOpen(false);
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};
