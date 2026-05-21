import { useQuery } from '@tanstack/react-query';

import { courseRepository } from '../../repository/course';
import { queryKeys } from '../../shared/query';

export const useCoursesViewModel = () =>
  useQuery({
    queryKey: queryKeys.courses,
    queryFn: () => courseRepository.getCourses(),
  });
