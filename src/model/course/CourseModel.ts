export interface CourseModel {
  id: string;
  title: string;
  color: string;
}

export interface CourseListResponseModel {
  courses: CourseModel[];
}
