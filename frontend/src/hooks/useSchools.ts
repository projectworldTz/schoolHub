import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveSchool,
  createSchool,
  listSchools,
  suspendSchool,
  type CreateSchoolPayload,
  type ListSchoolsParams,
} from '@/api/schools'

const SCHOOLS_QUERY_KEY = ['platform', 'schools'] as const

export function useSchools(params: ListSchoolsParams = {}) {
  return useQuery({
    queryKey: [...SCHOOLS_QUERY_KEY, params],
    queryFn: () => listSchools(params),
  })
}

export function useCreateSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSchoolPayload) => createSchool(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useApproveSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => approveSchool(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useSuspendSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendSchool(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}
