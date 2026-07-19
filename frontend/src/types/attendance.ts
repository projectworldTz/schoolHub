export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRosterRow {
  student_id: string
  admission_number: string
  full_name: string
  status: AttendanceStatus | null
  remarks: string | null
}
