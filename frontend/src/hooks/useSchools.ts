import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchSchool,
  setSchoolFeeManagement,
  setSchoolFeatures,
  approveSchool,
  createSchool,
  enterSchool,
  exitActingSchool,
  fetchPlatformDashboard,
  grantSchoolAiAccess,
  grantSchoolWebsiteAccess,
  listSchools,
  reactivateSchoolAiAccess,
  reactivateSchoolWebsiteAccess,
  renewSchoolLicense,
  revokeSchoolAiAccess,
  revokeSchoolWebsiteAccess,
  setSchoolCustomDomain,
  suspendSchool,
  suspendSchoolAiAccess,
  suspendSchoolWebsiteAccess,
  updateSchool,
  type CreateSchoolPayload,
  type GrantAiAccessPayload,
  type GrantWebsiteAccessPayload,
  type ListSchoolsParams,
  type UpdateSchoolPayload,
} from '@/api/schools'
import { fetchCurrentUser } from '@/api/auth'
import { SCHOOL_FEATURES, type SchoolFeatureSettings } from '@/config/schoolFeatures'
import type { User } from '@/types/auth'
import { AUTH_QUERY_KEY } from '@/hooks/useAuth'
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

export function useGrantSchoolWebsiteAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GrantWebsiteAccessPayload }) => grantSchoolWebsiteAccess(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useSuspendSchoolWebsiteAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => suspendSchoolWebsiteAccess(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useReactivateSchoolWebsiteAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => reactivateSchoolWebsiteAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

export function useRevokeSchoolWebsiteAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => revokeSchoolWebsiteAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
    },
  })
}

// Both mutations invalidate the auth query (not SCHOOLS_QUERY_KEY) because
// what actually changes is the current user's acting_school, which
// useCurrentUser() reads from /auth/me — see UserResource::actingSchool().
export function useEnterSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => enterSchool(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['school'] })
      queryClient.removeQueries({ queryKey: ['parent'] })
      await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY })
      queryClient.setQueryData(AUTH_QUERY_KEY, await fetchCurrentUser())
    },
  })
}

export function useExitActingSchool() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => exitActingSchool(),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['school'] })
      queryClient.removeQueries({ queryKey: ['parent'] })
      await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY })
      queryClient.setQueryData(AUTH_QUERY_KEY, await fetchCurrentUser())
    },
  })
}

export function useSchool(id: string) {
  return useQuery({ queryKey: [...SCHOOLS_QUERY_KEY, id], queryFn: () => fetchSchool(id), enabled: Boolean(id) })
}
export function useSetSchoolFeeManagement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => setSchoolFeeManagement(id, enabled),
    onSuccess: async (school) => {
      await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY })
      queryClient.setQueryData<User>(AUTH_QUERY_KEY, (user) => {
        if (!user || (user.acting_school?.id ?? user.school_id) !== school.id) return user
        return { ...user, fee_management_enabled: school.fee_management_enabled }
      })
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })
}

export function useSetSchoolFeatures() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: SchoolFeatureSettings }) => setSchoolFeatures(id, settings),
    onSuccess: async (school) => {
      await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY })
      queryClient.setQueryData<User>(AUTH_QUERY_KEY, (user) => {
        if (!user || (user.acting_school?.id ?? user.school_id) !== school.id) return user
        const updated = { ...user }
        for (const feature of SCHOOL_FEATURES) updated[feature.field] = school[feature.field]
        return updated
      })
      queryClient.setQueryData([...SCHOOLS_QUERY_KEY, school.id], school)
      queryClient.invalidateQueries({ queryKey: SCHOOLS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['school'] })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })
}
