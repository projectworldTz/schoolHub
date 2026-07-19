export interface Announcement {
  id: string
  title: string
  body: string
  audience: 'school' | 'class' | 'role'
  published_at: string | null
}

export interface Child {
  id: string
  full_name: string
  admission_number: string
  current_enrollment?: {
    academic_year_name?: string
    school_class_name?: string
    stream_name?: string | null
  } | null
}

export interface AttendanceRecord {
  id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks: string | null
}

export interface HomeworkSubmission {
  id: string
  homework_title: string
  subject_name: string | null
  due_date: string | null
  status: string
  grade: string | null
  feedback: string | null
}

export interface ExamResultGroup {
  exam_id: string
  exam_name: string
  exam_type: string
  subjects: {
    subject_name: string
    marks_obtained: string | null
    max_marks: string
    grade: string | null
  }[]
}
