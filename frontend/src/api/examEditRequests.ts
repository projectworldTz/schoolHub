import { apiClient } from '@/api/client'
import type { PaginatedResponse } from '@/types/school'
import type { ExamEditRequest, ExamEditRequestStatus } from '@/types/exams'

export async function listExamEditRequests(): Promise<PaginatedResponse<ExamEditRequest>> {
  const { data } = await apiClient.get<PaginatedResponse<ExamEditRequest>>('/school/exam-edit-requests')
  return data
}

export async function createExamEditRequest(examSubjectId: string, reason: string): Promise<ExamEditRequest> {
  const { data } = await apiClient.post<{ data: ExamEditRequest }>('/school/exam-edit-requests', {
    exam_subject_id: examSubjectId,
    reason,
  })
  return data.data
}

export async function reviewExamEditRequest(id: string, status: ExamEditRequestStatus): Promise<ExamEditRequest> {
  const { data } = await apiClient.post<{ data: ExamEditRequest }>(`/school/exam-edit-requests/${id}/review`, { status })
  return data.data
}

export async function deleteExamEditRequest(id: string): Promise<void> {
  await apiClient.delete(`/school/exam-edit-requests/${id}`)
}
