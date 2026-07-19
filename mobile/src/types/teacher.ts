export interface SchoolClassSummary {
  id: string
  name: string
  level: number
}

export interface AcademicYearSummary {
  id: string
  name: string
  start_date: string
  is_current: boolean
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRosterRow {
  student_id: string
  admission_number: string
  full_name: string
  status: AttendanceStatus | null
  remarks: string | null
}

export interface ExamSummary {
  id: string
  name: string
  exam_type: string
  status: string
}

export interface ExamSubjectSummary {
  id: string
  exam_id: string
  school_class_id: string
  school_class_name?: string
  subject_id: string
  subject_name?: string
  max_marks: string
  pass_marks: string | null
}

export interface ExamDetail extends ExamSummary {
  subjects: ExamSubjectSummary[]
}

export interface ExamResultRow {
  id: string
  exam_subject_id: string
  student_id: string
  student_name?: string
  admission_number?: string
  marks_obtained: string | null
  grade: string | null
  remarks: string | null
}
