import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSchoolUser,
  deleteSchoolUser,
  listAvailableRoles,
  listSchoolUsers,
  listUsedRoles,
  updateSchoolUser,
  type CreateSchoolUserPayload,
  type ListSchoolUsersParams,
  type UpdateSchoolUserPayload,
} from '@/api/school-users'

const USERS_KEY = ['school', 'users'] as const

export function useSchoolUsers(params: ListSchoolUsersParams = {}) {
  return useQuery({
    queryKey: [...USERS_KEY, params],
    queryFn: () => listSchoolUsers(params),
  })
}

export function useAvailableRoles() {
  return useQuery({ queryKey: ['school', 'roles'], queryFn: listAvailableRoles })
}

export function useUsedRoles() {
  return useQuery({ queryKey: ['school', 'users', 'roles'], queryFn: listUsedRoles })
}

export function useCreateSchoolUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSchoolUserPayload) => createSchoolUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export function useUpdateSchoolUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchoolUserPayload }) =>
      updateSchoolUser(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}

export function useDeleteSchoolUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSchoolUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  })
}
