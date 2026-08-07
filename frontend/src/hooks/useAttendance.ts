import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAttendanceLog,
  fetchAttendanceRegister,
  fetchStudentAttendanceHistory,
  markAttendance,
  type AttendanceLogParams,
  type AttendanceMarkPayload,
  type AttendanceRegisterParams,
} from '@/api/attendance'

export function useAttendanceRegister(params: AttendanceRegisterParams) {
  return useQuery({
    queryKey: ['school', 'attendance', 'register', params],
    queryFn: () => fetchAttendanceRegister(params),
    enabled: Boolean(params.school_class_id && params.academic_year_id && params.date),
  })
}

export function useStudentAttendanceHistory(studentId: string) {
  return useQuery({
    queryKey: ['school', 'students', studentId, 'attendance'],
    queryFn: () => fetchStudentAttendanceHistory(studentId),
    enabled: Boolean(studentId),
  })
}

export function useAttendanceLog(params: AttendanceLogParams) {
  return useQuery({
    queryKey: ['school', 'attendance', 'log', params],
    queryFn: () => fetchAttendanceLog(params),
  })
}

export function useMarkAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AttendanceMarkPayload) => markAttendance(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'attendance', 'register'] }),
  })
}
