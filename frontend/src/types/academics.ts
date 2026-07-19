export interface Subject {
  id: string
  department_id: string | null
  name: string
  code: string | null
  is_active: boolean
}

export interface SchoolClass {
  id: string
  name: string
  level: number
  branch_id: string | null
  branch_name?: string | null
  subjects?: Subject[]
  streams?: Stream[]
  created_at: string
}

export interface Room {
  id: string
  branch_id: string | null
  name: string
  capacity: number | null
  type: string
}

export interface Stream {
  id: string
  school_class_id: string
  academic_year_id: string
  name: string
  capacity: number | null
  class_teacher_id: string | null
  class_teacher_name: string | null
  room_id: string | null
  room_name: string | null
}

export interface GradeBand {
  id: string
  label: string
  min_score: number
  max_score: number
  remark: string | null
  gpa: number | null
}

export interface GradingSystem {
  id: string
  name: string
  is_default: boolean
  grade_bands: GradeBand[]
  created_at: string
}
