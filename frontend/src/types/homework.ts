export type HomeworkSubmissionStatus = 'pending' | 'submitted' | 'graded' | 'late'

export interface HomeworkSubmission {
  id: string
  homework_id: string
  student_id: string
  student_name?: string
  admission_number?: string
  status: HomeworkSubmissionStatus
  submitted_at: string | null
  grade: string | null
  feedback: string | null
}

export interface Homework {
  id: string
  school_class_id: string
  school_class_name?: string
  stream_id: string | null
  stream_name?: string | null
  subject_id: string
  subject_name?: string
  teacher_id: string
  teacher_name?: string
  academic_year_id: string
  title: string
  description: string | null
  due_date: string
  submissions_count?: number
  submissions?: HomeworkSubmission[]
  created_at: string
}
