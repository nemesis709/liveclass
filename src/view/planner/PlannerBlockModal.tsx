'use client';

import type { FormEvent } from 'react';

import type { CourseModel, PlannerBlockFormValueModel } from '../../model';

interface PlannerBlockModalProps {
  courses: CourseModel[];
  formValue: PlannerBlockFormValueModel;
  isSaving: boolean;
  isDeleting: boolean;
  canDelete: boolean;
  errorMessage: string | null;
  onChange: (
    key: keyof PlannerBlockFormValueModel,
    value: string | number,
  ) => void;
  onDelete: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const kDays = ['월', '화', '수', '목', '금', '토', '일'];

export const PlannerBlockModal = ({
  courses,
  formValue,
  isSaving,
  isDeleting,
  canDelete,
  errorMessage,
  onChange,
  onDelete,
  onClose,
  onSubmit,
}: PlannerBlockModalProps) => (
  <div className="planner-modal-backdrop" role="presentation" onClick={onClose}>
    <div
      className="planner-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="planner-modal-title"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="planner-modal__header">
        <div>
          <p className="planner-modal__eyebrow">Study Block</p>
          <h2 id="planner-modal-title">학습 블록 편집</h2>
        </div>
        <button
          type="button"
          className="planner-modal__close"
          onClick={onClose}
        >
          닫기
        </button>
      </div>

      <form className="planner-modal__form" onSubmit={onSubmit}>
        <label className="planner-field">
          <span>강의</span>
          <select
            value={formValue.courseId}
            onChange={(event) => onChange('courseId', event.target.value)}
          >
            <option value="">강의를 선택하세요</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <div className="planner-field-row">
          <label className="planner-field">
            <span>요일</span>
            <select
              value={formValue.dayOfWeek}
              onChange={(event) =>
                onChange('dayOfWeek', Number(event.target.value))
              }
            >
              {kDays.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label className="planner-field">
            <span>시작 시간</span>
            <input
              type="time"
              step={1800}
              value={formValue.startTime}
              onChange={(event) => onChange('startTime', event.target.value)}
            />
          </label>

          <label className="planner-field">
            <span>종료 시간</span>
            <input
              type="time"
              step={1800}
              value={formValue.endTime}
              onChange={(event) => onChange('endTime', event.target.value)}
            />
          </label>
        </div>

        <label className="planner-field">
          <span>메모</span>
          <textarea
            rows={4}
            maxLength={200}
            placeholder="무엇을 공부할지 간단히 적어두세요"
            value={formValue.memo}
            onChange={(event) => onChange('memo', event.target.value)}
          />
        </label>

        {errorMessage ? (
          <p className="planner-modal__error">{errorMessage}</p>
        ) : null}

        <div className="planner-modal__actions">
          {canDelete ? (
            <button
              type="button"
              className="planner-button planner-button--danger"
              disabled={isDeleting}
              onClick={onDelete}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          ) : null}
          <button type="button" className="planner-button planner-button--ghost" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="planner-button" disabled={isSaving}>
            {isSaving ? '저장 중...' : '반영'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
