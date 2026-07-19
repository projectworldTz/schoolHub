import { useQuery } from '@tanstack/react-query'
import { fetchActivityLogs, fetchActivityLogSubjectTypes, type ActivityLogParams } from '@/api/activityLog'

export function useActivityLogs(params: ActivityLogParams) {
  return useQuery({
    queryKey: ['school', 'activity-logs', params],
    queryFn: () => fetchActivityLogs(params),
  })
}

export function useActivityLogSubjectTypes() {
  return useQuery({
    queryKey: ['school', 'activity-log-subject-types'],
    queryFn: fetchActivityLogSubjectTypes,
  })
}
