# Engineering One Pager Template v1.0

create by: 전규현

Project Name :
LiveClass Weekly Study Planner MVP

Date :
2026-05-21

Submitter Info :
Beomjin Kim / Frontend Engineering Assignment

Project Description :
LiveClass Weekly Study Planner는 수강생이 한 주간의 학습 일정을 시간표 형태로 편집하고 저장할 수 있도록 돕는 학습 계획 기능이다. 사용자는 30분 단위 시간 그리드에서 학습 블록을 추가, 수정, 삭제할 수 있으며, 저장 전까지의 변경 사항은 편집 중 상태로 유지된다. 본 프로젝트는 시간 충돌 방지, 저장 상태 피드백, 주간 요약 제공을 통해 일정 편집 경험의 정확성과 일관성을 검증하는 MVP 구현을 목표로 한다.

Business and Marketing Justification :
학습 계획을 직접 구성하고 시각적으로 확인할 수 있는 기능은 에드테크 서비스에서 학습 지속성과 재방문율을 높이는 핵심 사용자 경험이다. 사용자는 강의별 학습 시간을 한 주 단위로 배분하고 수정하면서 자신의 학습 루틴을 구체화할 수 있고, 이는 서비스 체류 시간과 학습 몰입도를 높이는 기반이 된다. 본 MVP는 30분 단위 일정 편집, 충돌 검증, 일괄 저장, 주간 요약, 미저장 변경 경고를 통해 향후 학습 관리 기능 확장의 기준 구조를 검증한다.

Risk Assessment :
1. 시간 충돌 판정 기준이 모호하면 구현과 테스트 결과가 달라질 수 있다. 이를 방지하기 위해 인접 구간(예: 09:00-10:00, 10:00-11:00)은 충돌이 아니고 실제 시간이 겹치는 경우만 충돌로 정의한다.
2. 서버에 저장된 플래너와 사용자가 편집 중인 draft 상태가 혼합되면 저장 실패 시 수정 내역이 유실되거나 재진입 시 복구 기준이 불명확해질 수 있다. 이를 방지하기 위해 저장본 API와 draft API를 분리하고, 진입 시 draft가 존재하면 draft를 우선 복구하며 최종 저장 성공 시에만 저장본과 동기화한다.
3. 30분 단위 시간 그리드는 row 수 증가와 블록 높이 축소로 인해 배치 계산과 가독성 리스크가 커진다. 이를 방지하기 위해 시간 계산은 분 단위 정수로 통일하고, 슬롯 크기와 위치 계산을 전용 유틸로 분리하며, 모바일에서는 주간 전체 뷰 대신 일별 뷰로 단순화한다.
4. 주간 이동, 새로고침, 브라우저 종료 시 미저장 변경 사항을 잃을 위험이 있다. 이를 방지하기 위해 현재 주차 이동 전 확인 모달과 beforeunload 기반 이탈 경고를 제공하고, draft는 서버에 별도 저장해 재진입 이후에도 복구할 수 있도록 한다.
5. 주간 요약을 클라이언트마다 개별 계산하면 웹, 모바일, 운영 도구 간 집계 규칙이 달라질 수 있다. 이를 방지하기 위해 요약 집계는 서버 책임으로 두고 PlannerResponse 확장 필드인 summary로 함께 반환한다.

Resource and Scheduling Details :
본 프로젝트는 1인 개발로 진행하며 전체 일정은 2026-05-21부터 2026-05-25까지 5일로 계획한다. Day 1에는 요구사항 해석, One Pager 작성, API 및 데이터 모델 초안을 확정한다. Day 2에는 Next.js 프로젝트 구조와 Mock API, 30분 단위 시간 유틸, 주간 그리드 레이아웃을 구현한다. Day 3에는 블록 추가/수정/삭제 모달과 draft 편집 플로우, draft API, 시간 충돌 검증, 주간 요약 표시를 구현한다. Day 4에는 저장 API 연동, dirty/loading/success/error 상태 처리, 주간 이동 및 미저장 변경 경고를 구현한다. Day 5에는 beforeunload 이탈 방지, 테스트, README 문서화, UI 폴리싱, 제출 준비를 마무리한다.

Technical Description :
기술 스택은 TypeScript, React, Next.js App Router, TanStack Query를 사용한다. 서버 상태는 TanStack Query로 관리하고, 편집 중인 플래너 draft 상태와 모달 상태는 React state로 분리 관리한다. API 명세는 과제에서 제시한 GET /api/courses, GET /api/planner, PUT /api/planner를 기반으로 하되, 저장본과 분리된 draft 리소스를 위해 GET /api/planner/draft, PUT /api/planner/draft, DELETE /api/planner/draft를 추가한다. 주간 요약의 일관된 계산 책임을 위해 PlannerResponse에 summary 필드를 확장한다. 시간 데이터는 API 명세에 맞게 HH:mm 문자열로 송수신하되 내부 계산에서는 분 단위 정수로 변환해 충돌 판정, duration 계산, 30분 단위 그리드 위치 계산에 사용한다. 가산점 항목 중 구현 우선순위는 30분 단위 시간 정밀도, 이전 주/다음 주 이동, draft 복구, 미저장 변경 경고, 브라우저 이탈 방지로 설정한다.

API
- Swagger: [docs/api/swagger.yaml](../api/swagger.yaml)

ERD
- PostgreSQL DDL: [docs/database/erd.md](../database/erd.md)

주요 기술적 결정:
- 주간 플래너 조회 응답은 StudyBlock 목록과 summary를 함께 반환한다.
- 저장 전 수정 사항은 저장본과 분리된 draft API에 저장하며, 최종 저장 성공 시 draft를 정리한다.
- 플래너 시간 슬롯은 30분 단위를 기본으로 지원하고, 모든 시간 계산은 분 단위 정수 기반으로 수행한다.
- 주간 이동 시 현재 weekStart 기준으로 서버 상태를 조회하며, dirty 상태인 경우 이동 전 사용자 확인을 수행한다.
- 브라우저 새로고침 또는 종료 시 저장되지 않은 변경 사항이 있으면 이탈 경고를 제공한다.
