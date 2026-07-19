export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface LessonPlanActivity {
  name: string
  duration_minutes: number
  description: string
}

export interface LessonPlan {
  title: string
  objectives: string[]
  materials: string[]
  activities: LessonPlanActivity[]
  assessment: string
  homework: string
}

export interface LessonPlanParams {
  subject_id: string
  school_class_id: string
  topic: string
  duration_minutes: number
  notes?: string
}
