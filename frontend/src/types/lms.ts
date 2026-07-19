export interface Lesson {
  id: string
  course_id: string
  title: string
  content: string | null
  sort_order: number
  created_at: string
}

export interface Course {
  id: string
  subject_id: string
  subject_name?: string
  school_class_id: string | null
  school_class_name?: string | null
  teacher_id: string
  teacher_name?: string
  title: string
  description: string | null
  is_published: boolean
  lessons_count?: number
  lessons?: Lesson[]
  created_at: string
}
