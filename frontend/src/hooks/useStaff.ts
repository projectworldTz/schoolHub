import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  createLeaveRequest,
  createStaffContract,
  deleteLeaveRequest,
  deleteStaffContract,
  importTeachers,
  listLeaveRequests,
  listStaff,
  listStaffContracts,
  reviewLeaveRequest,
  staffApi,
  syncTeacherClasses,
  syncTeacherSubjects,
} from '@/api/staff'
import type { LeaveRequest, StaffContract, StaffProfile } from '@/types/staff'

const rawStaffHooks = createCrudHooks<StaffProfile>('staff', staffApi)

export function useStaffList(search = '', page?: number, perPage?: number) {
  return useQuery({
    queryKey: ['school', 'staff', search, page, perPage],
    queryFn: () => listStaff(search, page, perPage),
  })
}

export const useCreateStaff = rawStaffHooks.useCreate
export const useUpdateStaff = rawStaffHooks.useUpdate
export const useRemoveStaff = rawStaffHooks.useRemove

export function useSyncTeacherSubjects() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ staffId, subjectIds }: { staffId: string; subjectIds: string[] }) =>
      syncTeacherSubjects(staffId, subjectIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'staff'] }),
  })
}

export function useSyncTeacherClasses() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ staffId, classIds }: { staffId: string; classIds: string[] }) =>
      syncTeacherClasses(staffId, classIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'staff'] }),
  })
}

export function useImportTeachers() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => importTeachers(file, dryRun),
    onSuccess: (result) => {
      if (result.committed) {
        queryClient.invalidateQueries({ queryKey: ['school', 'staff'] })
      }
    },
  })
}

export function useStaffContracts(staffId: string) {
  return useQuery({
    queryKey: ['school', 'staff', staffId, 'contracts'],
    queryFn: () => listStaffContracts(staffId),
    enabled: Boolean(staffId),
  })
}

export function useCreateStaffContract(staffId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<StaffContract>) => createStaffContract({ ...payload, user_id: staffId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'staff', staffId, 'contracts'] }),
  })
}

export function useDeleteStaffContract(staffId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteStaffContract,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'staff', staffId, 'contracts'] }),
  })
}

export function useLeaveRequests() {
  return useQuery({ queryKey: ['school', 'leave-requests'], queryFn: listLeaveRequests })
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<LeaveRequest>) => createLeaveRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'leave-requests'] }),
  })
}

export function useReviewLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => reviewLeaveRequest(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'leave-requests'] }),
  })
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLeaveRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'leave-requests'] }),
  })
}
