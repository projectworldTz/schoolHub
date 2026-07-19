import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCourse,
  createLesson,
  deleteCourse,
  deleteLesson,
  fetchCourse,
  listCourses,
  type CoursePayload,
  type LessonPayload,
} from '@/api/lms'

const COURSES_KEY = ['school', 'courses'] as const

export function useCourses() {
  return useQuery({ queryKey: COURSES_KEY, queryFn: listCourses })
}

export function useCourse(id: string) {
  return useQuery({ queryKey: [...COURSES_KEY, id], queryFn: () => fetchCourse(id), enabled: Boolean(id) })
}

export function useCreateCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CoursePayload) => createCourse(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}

export function useDeleteCourse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COURSES_KEY }),
  })
}

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LessonPayload) => createLesson(courseId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...COURSES_KEY, courseId] }),
  })
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLesson,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...COURSES_KEY, courseId] }),
  })
}
