import { apiClient } from '@/api/client'
import type { EligibleStudent, StudentStatusChange, StudentTargetStatus } from '@/types/graduation'

export interface EligibleStudentsParams {
  school_class_id?: string
  academic_year_id?: string
}

export interface GraduationBatchPayload {
  student_ids: string[]
  to_status: StudentTargetStatus
  effective_date: string
  reason?: string
}

export async function fetchEligibleStudents(params: EligibleStudentsParams): Promise<EligibleStudent[]> {
  const { data } = await apiClient.get<{ data: EligibleStudent[] }>('/school/graduation/eligible', { params })
  return data.data
}

export async function graduateBatch(payload: GraduationBatchPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/school/graduation/batch', payload)
  return data
}

export async function fetchStatusChangeHistory(): Promise<StudentStatusChange[]> {
  const { data } = await apiClient.get<{ data: StudentStatusChange[] }>('/school/graduation/history')
  return data.data
}
