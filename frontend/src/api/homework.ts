import { apiClient } from '@/api/client'
import type { Homework, HomeworkSubmission } from '@/types/homework'

export interface HomeworkPayload {
  school_class_id: string
  stream_id?: string
  subject_id: string
  teacher_id: string
  academic_year_id: string
  title: string
  description?: string
  due_date: string
}

export interface ListHomeworksParams {
  school_class_id?: string
  subject_id?: string
  teacher_id?: string
}

export async function listHomeworks(params: ListHomeworksParams = {}): Promise<Homework[]> {
  const { data } = await apiClient.get<{ data: Homework[] }>('/school/homeworks', { params })
  return data.data
}

export async function fetchHomework(id: string): Promise<Homework> {
  const { data } = await apiClient.get<{ data: Homework }>(`/school/homeworks/${id}`)
  return data.data
}

export async function createHomework(payload: HomeworkPayload): Promise<Homework> {
  const { data } = await apiClient.post<{ data: Homework }>('/school/homeworks', payload)
  return data.data
}

export async function deleteHomework(id: string): Promise<void> {
  await apiClient.delete(`/school/homeworks/${id}`)
}

export interface GradeSubmissionPayload {
  status: string
  grade?: number | null
  feedback?: string | null
}

export async function gradeSubmission(id: string, payload: GradeSubmissionPayload): Promise<HomeworkSubmission> {
  const { data } = await apiClient.put<{ data: HomeworkSubmission }>(`/school/homework-submissions/${id}`, payload)
  return data.data
}
