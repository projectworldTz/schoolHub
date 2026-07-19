export interface ParentAttendanceRecord {
  id: string
  student_id: string
  school_class_id: string
  stream_id: string | null
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  remarks: string | null
}

export interface ParentHomeworkItem {
  id: string
  homework_title: string
  subject_name: string | null
  due_date: string | null
  status: 'pending' | 'submitted' | 'graded' | 'late'
  grade: string | null
  feedback: string | null
}

export interface ParentResultSubject {
  subject_name: string
  marks_obtained: string | null
  max_marks: string
  grade: string | null
}

export interface ParentPerformanceMessage {
  tier: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'fail' | 'unknown'
  emoji: string
  title: string
  message: string
}

export interface ParentResultGroup {
  exam_id: string
  exam_name: string
  exam_type: string
  subjects: ParentResultSubject[]
  average_percentage: number | null
  overall_grade: string | null
  class_position: number | null
  class_size: number
  performance_message: ParentPerformanceMessage
}

export interface ParentAnnouncement {
  id: string
  title: string
  body: string
  audience: string
  published_at: string | null
}
