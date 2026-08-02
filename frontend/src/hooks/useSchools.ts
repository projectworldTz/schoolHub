import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveSchool,
  createSchool,
  fetchPlatformDashboard,
  grantSchoolAiAccess,
  listSchools,
  reactivateSchoolAiAccess,
  renewSchoolLicense,
  revokeSchoolAiAccess,
  setSchoolCustomDomain,
  suspendSchool,
  suspendSchoolAiAccess,
  updateSchool,
  type CreateSchoolPayload,
  type GrantAiAccessPayload,
  type ListSchoolsParams,
  type UpdateSchoolPayload,
} from '@/api/schools'
import type { LicenseDurationMonths } from '@/types/school'

const SCHOOLS_QUERY_KEY = ['platform', 'schools'] as const

export function useSchools(params: ListSchoolsParams = {}) {
  return useQuery({
    queryKey: [...SCHOOLS_QUERY_KEY, params],
    queryFn: () => listSchools(params),
  })
}

export function useSetSchoolCustomDomain() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, customDomain }: { id: string; customDomain: string | null }) => setSchoolCustomDomain(id, customDomain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function usePlatformDashboard() {
  return useQuery({
    queryKey: ['platform', 'dashboard'],
    queryFn: fetchPlatformDashboard,
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

export function useUpdateSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSchoolPayload }) => updateSchool(id, payload),
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

export function useRenewSchoolLicense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, months }: { id: string; months: LicenseDurationMonths }) => renewSchoolLicense(id, months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useGrantSchoolAiAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GrantAiAccessPayload }) => grantSchoolAiAccess(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useSuspendSchoolAiAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendSchoolAiAccess(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useReactivateSchoolAiAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reactivateSchoolAiAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useRevokeSchoolAiAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => revokeSchoolAiAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}
