export interface GeneratedReport {
  id: string
  title: string
  format: 'pdf' | 'xlsx' | 'csv'
  status: string
  expires_at: string | null
  download_url: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  report?: GeneratedReport | null
}

export interface ChatResult {
  reply: string
  report: GeneratedReport | null
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
