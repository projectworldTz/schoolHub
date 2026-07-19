import { apiClient } from '@/api/client'
import type { Course, Lesson } from '@/types/lms'

export interface CoursePayload {
  subject_id: string
  school_class_id?: string
  teacher_id: string
  title: string
  description?: string
  is_published?: boolean
}

export async function listCourses(): Promise<Course[]> {
  const { data } = await apiClient.get<{ data: Course[] }>('/school/courses')
  return data.data
}

export async function fetchCourse(id: string): Promise<Course> {
  const { data } = await apiClient.get<{ data: Course }>(`/school/courses/${id}`)
  return data.data
}

export async function createCourse(payload: CoursePayload): Promise<Course> {
  const { data } = await apiClient.post<{ data: Course }>('/school/courses', payload)
  return data.data
}

export async function deleteCourse(id: string): Promise<void> {
  await apiClient.delete(`/school/courses/${id}`)
}

export interface LessonPayload {
  title: string
  content?: string
  sort_order?: number
}

export async function createLesson(courseId: string, payload: LessonPayload): Promise<Lesson> {
  const { data } = await apiClient.post<{ data: Lesson }>(`/school/courses/${courseId}/lessons`, payload)
  return data.data
}

export async function deleteLesson(id: string): Promise<void> {
  await apiClient.delete(`/school/lessons/${id}`)
}
