import { apiClient } from '@/api/client'
import type { StaffAttendanceRosterRow, StaffAttendanceStatus } from '@/types/staffAttendance'

export interface StaffAttendanceRegisterParams {
  date: string
}

export interface StaffAttendanceMarkPayload {
  date: string
  records: { user_id: string; status: StaffAttendanceStatus; remarks?: string }[]
}

export async function fetchStaffAttendanceRegister(
  params: StaffAttendanceRegisterParams
): Promise<StaffAttendanceRosterRow[]> {
  const { data } = await apiClient.get<{ data: StaffAttendanceRosterRow[] }>('/school/staff-attendance/register', {
    params,
  })
  return data.data
}

export async function markStaffAttendance(payload: StaffAttendanceMarkPayload): Promise<void> {
  await apiClient.post('/school/staff-attendance', payload)
}
