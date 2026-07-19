import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchStaffAttendanceRegister,
  markStaffAttendance,
  type StaffAttendanceMarkPayload,
  type StaffAttendanceRegisterParams,
} from '@/api/staffAttendance'

export function useStaffAttendanceRegister(params: StaffAttendanceRegisterParams) {
  return useQuery({
    queryKey: ['school', 'staff-attendance', 'register', params],
    queryFn: () => fetchStaffAttendanceRegister(params),
    enabled: Boolean(params.date),
  })
}

export function useMarkStaffAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StaffAttendanceMarkPayload) => markStaffAttendance(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'staff-attendance', 'register'] }),
  })
}
