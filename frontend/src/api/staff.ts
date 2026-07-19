import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { PaginatedResponse } from '@/types/school'
import type { LeaveRequest, StaffContract, StaffProfile } from '@/types/staff'

export const staffApi = createCrudApi<StaffProfile>('staff')

export async function listStaff(search = ''): Promise<PaginatedResponse<StaffProfile>> {
  const { data } = await apiClient.get<PaginatedResponse<StaffProfile>>('/school/staff', { params: { search } })
  return data
}

export async function syncTeacherSubjects(staffId: string, subjectIds: string[]): Promise<StaffProfile> {
  const { data } = await apiClient.put<{ data: StaffProfile }>(`/school/staff/${staffId}/subjects`, {
    subject_ids: subjectIds,
  })
  return data.data
}

export async function listStaffContracts(staffId: string): Promise<StaffContract[]> {
  const { data } = await apiClient.get<{ data: StaffContract[] }>(`/school/staff/${staffId}/contracts`)
  return data.data
}

export async function createStaffContract(payload: Partial<StaffContract>): Promise<StaffContract> {
  const { data } = await apiClient.post<{ data: StaffContract }>('/school/staff-contracts', payload)
  return data.data
}

export async function deleteStaffContract(id: string): Promise<void> {
  await apiClient.delete(`/school/staff-contracts/${id}`)
}

export async function listLeaveRequests(): Promise<PaginatedResponse<LeaveRequest>> {
  const { data } = await apiClient.get<PaginatedResponse<LeaveRequest>>('/school/leave-requests')
  return data
}

export async function createLeaveRequest(payload: Partial<LeaveRequest>): Promise<LeaveRequest> {
  const { data } = await apiClient.post<{ data: LeaveRequest }>('/school/leave-requests', payload)
  return data.data
}

export async function reviewLeaveRequest(id: string, status: 'approved' | 'rejected'): Promise<LeaveRequest> {
  const { data } = await apiClient.post<{ data: LeaveRequest }>(`/school/leave-requests/${id}/review`, { status })
  return data.data
}

export async function deleteLeaveRequest(id: string): Promise<void> {
  await apiClient.delete(`/school/leave-requests/${id}`)
}
