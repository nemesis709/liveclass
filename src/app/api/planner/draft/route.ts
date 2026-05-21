import { NextRequest, NextResponse } from 'next/server';

import type { SavePlannerDraftRequestModel } from '../../../../model/planner';
import { plannerMockStore } from '../../../../mocks/handlers/plannerMockStore';

const getWeekStart = (request: NextRequest): string | null =>
  request.nextUrl.searchParams.get('weekStart');

export const GET = async (
  request: NextRequest,
): Promise<NextResponse> => {
  const weekStart = getWeekStart(request);

  if (!weekStart) {
    return NextResponse.json(
      {
        code: 'INVALID_BLOCK',
        message: 'weekStart query parameter is required',
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    plannerMockStore.getPlannerDraft(weekStart) ?? {
      weekStart,
      blocks: [],
      updatedAt: new Date(0).toISOString(),
    },
  );
};

export const PUT = async (
  request: NextRequest,
): Promise<NextResponse> => {
  const payload = (await request.json()) as SavePlannerDraftRequestModel;
  const result = plannerMockStore.savePlannerDraft(payload);

  if ('code' in result) {
    return NextResponse.json(result, {
      status: result.code === 'TIME_CONFLICT' ? 409 : 400,
    });
  }

  return NextResponse.json(result);
};

export const DELETE = async (
  request: NextRequest,
): Promise<NextResponse> => {
  const weekStart = getWeekStart(request);

  if (!weekStart) {
    return NextResponse.json(
      {
        code: 'INVALID_BLOCK',
        message: 'weekStart query parameter is required',
      },
      { status: 400 },
    );
  }

  plannerMockStore.deletePlannerDraft(weekStart);

  return new NextResponse(null, { status: 204 });
};
