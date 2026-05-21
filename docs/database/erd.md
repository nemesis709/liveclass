# LiveClass Weekly Study Planner ERD

## 개요

본 문서는 LiveClass Weekly Study Planner MVP의 데이터 구조를 PostgreSQL DDL 수준으로 정리한 문서입니다. 실제 과제 구현은 Mock API 기반으로 진행하지만, 주간 플래너 조회/저장, draft 조회/저장, 30분 단위 시간 슬롯, 주간 요약 계산 책임을 명확히 하기 위해 데이터 모델과 관계를 정의합니다.

## 설계 원칙

- API 응답 필드는 camelCase를 사용한다.
- 데이터 저장 모델은 PostgreSQL snake_case 기준으로 기술한다.
- 주간 요약은 클라이언트 파생 계산이 아닌 서버 계산 결과로 간주한다.
- StudyBlock의 시간 값은 저장 시 HH:mm 문자열이지만 내부 계산은 분 단위 정수로 변환해 처리한다.
- 30분 단위 입력을 기본 지원하며, 저장 포맷은 09:00, 09:30 형태의 문자열을 유지한다.
- 저장본(planner)과 임시저장본(planner_drafts)은 별도 리소스로 관리한다.

## 엔티티 관계

- 한 명의 학습 사용자(user)는 여러 주차 planner를 가진다.
- 하나의 planner는 여러 study_block을 가진다.
- 하나의 study_block은 하나의 course를 참조한다.
- 하나의 planner_draft는 하나의 user와 하나의 week_start 조합에 대해 1개만 존재한다.
- planner_summary는 planner의 파생 데이터이며 summary 응답 생성을 위한 뷰 성격의 구조다.

## PostgreSQL DDL

```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE courses (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE planners (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    week_start DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_planners_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_planners_user_week
        UNIQUE (user_id, week_start)
);

CREATE TABLE study_blocks (
    id VARCHAR(50) PRIMARY KEY,
    planner_id VARCHAR(50) NOT NULL,
    course_id VARCHAR(50) NOT NULL,
    day_of_week SMALLINT NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    memo VARCHAR(200),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_study_blocks_planner
        FOREIGN KEY (planner_id) REFERENCES planners(id) ON DELETE CASCADE,
    CONSTRAINT fk_study_blocks_course
        FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT chk_study_blocks_day_of_week
        CHECK (day_of_week BETWEEN 0 AND 6)
);

CREATE INDEX idx_planners_user_id ON planners(user_id);
CREATE INDEX idx_planners_week_start ON planners(week_start);
CREATE INDEX idx_study_blocks_planner_id ON study_blocks(planner_id);
CREATE INDEX idx_study_blocks_course_id ON study_blocks(course_id);
CREATE INDEX idx_study_blocks_day_of_week ON study_blocks(day_of_week);

CREATE TABLE planner_drafts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    week_start DATE NOT NULL,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_planner_drafts_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uq_planner_drafts_user_week
        UNIQUE (user_id, week_start)
);

CREATE INDEX idx_planner_drafts_user_id ON planner_drafts(user_id);
CREATE INDEX idx_planner_drafts_week_start ON planner_drafts(week_start);
```

## Summary 응답 모델

`summary`는 별도 영속 테이블이 아니라 planner와 study_blocks를 기준으로 계산되는 파생 응답 모델입니다.

```ts
interface PlannerSummary {
  totalMinutes: number;
  byCourse: Array<{
    courseId: string;
    totalMinutes: number;
  }>;
  byDay: Array<{
    dayOfWeek: number;
    totalMinutes: number;
  }>;
  formattedTotal?: string;
}
```

## 비즈니스 규칙

- 같은 planner 안에서 시간이 실제로 겹치는 두 study_block은 동시에 저장될 수 없다.
- 같은 week_start에 대해 저장본과 draft는 별도 리소스로 존재할 수 있다.
- 인접 구간은 충돌이 아니다. 예: 09:00-10:00과 10:00-11:00
- start_time은 end_time보다 앞서야 한다.
- 플래너 기본 시간 범위는 08:00~20:00이며, 슬롯 간격은 30분이다.
- 30분 단위는 저장 포맷 변경 없이 시간 유틸 및 입력 슬롯 확장으로 대응한다.
- 이전 주/다음 주 이동은 week_start를 기준으로 planner를 조회하는 방식으로 처리한다.
- 미저장 변경 상태는 draft와 저장본 비교로 판정한다.
- 최종 저장 성공 시 해당 week_start의 draft는 삭제하거나 최신 저장본 기준으로 정리한다.
```
