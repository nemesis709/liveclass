import { NextRequest, NextResponse } from 'next/server';

import type { SavePlannerRequestModel } from '../../../model/planner';
import { plannerMockStore } from '../../../mocks/handlers/plannerMockStore';

const getWeekStart = (request: NextRequest): string | null =>
  request.nextUrl.searchParams.get('weekStart');

const delay = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

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

  return NextResponse.json(plannerMockStore.getPlanner(weekStart));
};

export const PUT = async (
  request: NextRequest,
): Promise<NextResponse> => {
  await delay(900);

  const payload = (await request.json()) as SavePlannerRequestModel;
  const result = plannerMockStore.savePlanner(payload);

  if ('code' in result) {
    return NextResponse.json(result, {
      status: result.code === 'TIME_CONFLICT' ? 409 : 400,
    });
  }

  return NextResponse.json(result);
};
