import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { createCrudApi } from '@/api/crud'

export function createCrudHooks<T extends { id: string }, TPayload = Partial<T>>(
  queryKey: string,
  api: ReturnType<typeof createCrudApi<T, TPayload>>
) {
  const key = ['school', queryKey] as const

  function useList() {
    return useQuery({ queryKey: key, queryFn: api.list })
  }

  function useCreate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: api.create,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    })
  }

  function useUpdate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: TPayload }) => api.update(id, payload),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    })
  }

  function useRemove() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: api.remove,
      onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    })
  }

  return { useList, useCreate, useUpdate, useRemove }
}
