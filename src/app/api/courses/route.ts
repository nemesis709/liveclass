import { NextResponse } from 'next/server';

import { kCourses } from '../../../mocks/data/courses';

export const GET = async (): Promise<NextResponse> =>
  NextResponse.json({
    courses: kCourses,
  });
