import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createApiToken, deleteApiToken, listApiTokens, type CreateApiTokenPayload } from '@/api/apiTokens'

const TOKENS_KEY = ['tokens'] as const

export function useApiTokens() {
  return useQuery({ queryKey: TOKENS_KEY, queryFn: listApiTokens })
}

export function useCreateApiToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateApiTokenPayload) => createApiToken(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
  })
}

export function useDeleteApiToken() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteApiToken,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TOKENS_KEY }),
  })
}
