export type StaffAttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'on_leave'

export interface StaffAttendanceRosterRow {
  user_id: string
  name: string
  job_title: string | null
  status: StaffAttendanceStatus | null
  remarks: string | null
}
