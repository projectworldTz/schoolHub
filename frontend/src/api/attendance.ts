import { apiClient } from '@/api/client'
import type { AttendanceHistory, AttendanceRecord, AttendanceRosterRow, AttendanceStatus } from '@/types/attendance'

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

export interface AttendanceRegisterResponse {
  rows: AttendanceRosterRow[]
  confirmed: boolean
  confirmed_at: string | null
  confirmed_by_name: string | null
}

export async function fetchAttendanceRegister(params: AttendanceRegisterParams): Promise<AttendanceRegisterResponse> {
  const { data } = await apiClient.get<{
    data: AttendanceRosterRow[]
    meta: { confirmed: boolean; confirmed_at: string | null; confirmed_by_name: string | null }
  }>('/school/attendance/register', { params })
  return {
    rows: data.data,
    confirmed: data.meta.confirmed,
    confirmed_at: data.meta.confirmed_at,
    confirmed_by_name: data.meta.confirmed_by_name,
  }
}

export async function markAttendance(payload: AttendanceMarkPayload): Promise<void> {
  await apiClient.post('/school/attendance', payload)
}

export async function fetchStudentAttendanceHistory(studentId: string): Promise<AttendanceHistory> {
  const { data } = await apiClient.get<{ data: AttendanceRecord[]; meta: { trend: AttendanceHistory['trend'] } }>(
    `/school/students/${studentId}/attendance`
  )
  return { records: data.data, trend: data.meta.trend }
}
