export type ExamType = 'quiz' | 'midterm' | 'final' | 'mock' | 'other'
export type ExamStatus = 'draft' | 'scheduled' | 'completed' | 'published'

export interface ExamResult {
  id: string
  exam_subject_id: string
  student_id: string
  student_name?: string
  admission_number?: string
  marks_obtained: string | null
  grade: string | null
  remarks: string | null
}

export interface ExamSubject {
  id: string
  exam_id: string
  school_class_id: string
  school_class_name?: string
  subject_id: string
  subject_name?: string
  max_marks: string
  pass_marks: string | null
  exam_date: string | null
  results?: ExamResult[]
}

export interface Exam {
  id: string
  academic_year_id: string
  academic_year_name?: string
  term_id: string | null
  term_name?: string | null
  name: string
  exam_type: ExamType
  start_date: string | null
  end_date: string | null
  status: ExamStatus
  subjects?: ExamSubject[]
  created_at: string
}

export type PerformanceTier = 'excellent' | 'good' | 'average' | 'needs_improvement' | 'fail' | 'unknown'

export interface PerformanceMessage {
  tier: PerformanceTier
  emoji: string
  title: string
  message: string
}

export interface ReportCard {
  student_id: string
  student_name: string
  admission_number: string
  exam_id: string
  exam_name: string
  subjects: {
    subject_name: string
    marks_obtained: string | null
    max_marks: string
    grade: string | null
    remarks: string | null
    subject_position: number | null
    subject_size: number
  }[]
  summary: {
    total_obtained: number
    total_max: number
    average_percentage: number | null
    overall_grade: string | null
    class_position: number | null
    class_size: number
    class_teacher_remark?: string | null
    performance_message?: PerformanceMessage
  }
}

export interface ClassRankingRow {
  student_id: string
  name: string
  admission_number: string
  average_percentage: number
  total_obtained: number
  total_max: number
  subjects_graded: number
  grade: string | null
  position: number
}

export interface ClassSummary {
  class_average: number | null
  pass_rate: number | null
  students_graded: number
  strongest_subject: { name: string; average_percentage: number } | null
  weakest_subject: { name: string; average_percentage: number } | null
  performance_message: PerformanceMessage
}

export interface TeacherPerformanceRow {
  teacher_id: string
  teacher_name: string
  average_percentage: number
  students_graded: number
  subjects: { subject_name: string; class_name: string; average_percentage: number }[]
  position: number
}
