export type StudentTargetStatus = 'graduated' | 'transferred' | 'withdrawn'

export interface EligibleStudent {
  student_id: string
  name: string
  admission_number: string
  class_name: string | null
  stream_name: string | null
}

export interface StudentStatusChange {
  id: string
  student_id: string
  student_name?: string
  admission_number?: string
  from_status: string
  to_status: string
  effective_date: string
  reason: string | null
  changed_by_name?: string
  created_at: string
}
