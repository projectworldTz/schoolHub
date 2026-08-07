export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRosterRow {
  student_id: string
  admission_number: string
  full_name: string
  status: AttendanceStatus | null
  remarks: string | null
}

export interface AttendanceRecord {
  id: string
  student_id: string
  student_name?: string
  admission_number?: string
  school_class_id: string
  school_class_name?: string
  stream_id: string | null
  date: string
  status: AttendanceStatus
  remarks: string | null
  marked_by: string | null
  marked_by_name?: string
}

/** One point per calendar month — the line-graph trend behind a student's attendance history. */
export interface AttendanceTrendPoint {
  period: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
  rate: number
}

export interface AttendanceHistory {
  records: AttendanceRecord[]
  trend: AttendanceTrendPoint[]
}
