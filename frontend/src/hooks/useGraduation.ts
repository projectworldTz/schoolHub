import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchEligibleStudents,
  fetchStatusChangeHistory,
  graduateBatch,
  type EligibleStudentsParams,
  type GraduationBatchPayload,
} from '@/api/graduation'

export function useEligibleStudents(params: EligibleStudentsParams) {
  return useQuery({
    queryKey: ['school', 'graduation', 'eligible', params],
    queryFn: () => fetchEligibleStudents(params),
  })
}

export function useStatusChangeHistory() {
  return useQuery({ queryKey: ['school', 'graduation', 'history'], queryFn: fetchStatusChangeHistory })
}

export function useGraduateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GraduationBatchPayload) => graduateBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'graduation'] })
      queryClient.invalidateQueries({ queryKey: ['school', 'students'] })
    },
  })
}
