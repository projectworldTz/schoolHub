import { apiClient } from '@/api/client'
import type { PaginatedResponse } from '@/types/school'
import type { ActivityLogEntry } from '@/types/activityLog'

export interface ActivityLogParams {
  subject_type?: string
  action?: string
  per_page?: number
  page?: number
}

export async function fetchActivityLogs(params: ActivityLogParams): Promise<PaginatedResponse<ActivityLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<ActivityLogEntry>>('/school/activity-logs', { params })
  return data
}

export async function fetchActivityLogSubjectTypes(): Promise<string[]> {
  const { data } = await apiClient.get<{ data: string[] }>('/school/activity-log-subject-types')
  return data.data
}
