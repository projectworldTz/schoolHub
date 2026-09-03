import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAccountSessions, revokeAccountSession } from '@/api/sessions'

const SESSIONS_KEY = ['account', 'sessions'] as const

export function useAccountSessions() {
  return useQuery({ queryKey: SESSIONS_KEY, queryFn: listAccountSessions })
}

export function useRevokeAccountSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: revokeAccountSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SESSIONS_KEY }),
  })
}
