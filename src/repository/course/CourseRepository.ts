import type { CourseListResponseModel } from '../../model/course';

export interface CourseRepository {
  getCourses(): Promise<CourseListResponseModel>;
}

export type CourseRepositoryType = CourseRepository;
