import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAttendanceRegister,
  markAttendance,
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

export function useMarkAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AttendanceMarkPayload) => markAttendance(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'attendance', 'register'] }),
  })
}
