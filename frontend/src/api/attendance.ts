import { apiClient } from '@/api/client'
import type { AttendanceRosterRow, AttendanceStatus } from '@/types/attendance'

export interface AttendanceRegisterParams {
  school_class_id: string
  stream_id?: string
  academic_year_id: string
  date: string
}

export interface AttendanceMarkPayload {
  school_class_id: string
  stream_id?: string
  academic_year_id: string
  date: string
  records: { student_id: string; status: AttendanceStatus; remarks?: string }[]
}

export async function fetchAttendanceRegister(params: AttendanceRegisterParams): Promise<AttendanceRosterRow[]> {
  const { data } = await apiClient.get<{ data: AttendanceRosterRow[] }>('/school/attendance/register', { params })
  return data.data
}

export async function markAttendance(payload: AttendanceMarkPayload): Promise<void> {
  await apiClient.post('/school/attendance', payload)
}
