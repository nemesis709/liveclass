import type { CourseListResponseModel } from '../../model/course';
import { apiClient } from '../../shared/api';
import type { CourseRepositoryType } from './CourseRepository';

export const courseRepository: CourseRepositoryType = {
  async getCourses(): Promise<CourseListResponseModel> {
    const { data } = await apiClient.get<CourseListResponseModel>('/courses');
    return data;
  },
};
