export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface TimetablePeriod {
  id: string
  name: string
  start_time: string
  end_time: string
  sort_order: number
  is_break: boolean
}

export interface TimetableEntry {
  id: string
  school_class_id: string
  school_class_name?: string
  stream_id: string | null
  stream_name?: string | null
  subject_id: string
  subject_name?: string
  teacher_id: string
  teacher_name?: string
  room_id: string | null
  room_name?: string | null
  timetable_period_id: string
  period?: TimetablePeriod
  academic_year_id: string
  day_of_week: DayOfWeek
}

export interface TeacherAvailability {
  id: string
  teacher_id: string
  academic_year_id: string
  timetable_period_id: string
  day_of_week: DayOfWeek
  is_available: boolean
}

export interface TimetableSubstitution {
  id: string
  timetable_entry_id: string
  substitute_teacher_id: string
  date: string
  reason: string | null
  substitute_teacher?: { id: string; name: string }
  timetable_entry?: TimetableEntry
}
