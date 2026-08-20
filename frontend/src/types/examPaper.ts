export type ExamPaperSectionType = 'multiple_choice' | 'matching' | 'short_answer'

export interface McqOption {
  label: string
  text: string
}

export interface McqQuestion {
  number: number
  question: string
  options: McqOption[]
  correct_option: string
  marks: number
}

export interface ShortAnswerQuestion {
  number: number
  question: string
  model_answer: string
  marks: number
}

export interface MatchItem {
  key: string
  text: string
}

export interface MultipleChoiceSection {
  type: 'multiple_choice'
  title: string
  instructions: string
  questions: McqQuestion[]
}

export interface MatchingSection {
  type: 'matching'
  title: string
  instructions: string
  left_items: MatchItem[]
  right_items: MatchItem[]
  correct_matches: Record<string, string>
  marks_per_pair: number
}

export interface ShortAnswerSection {
  type: 'short_answer'
  title: string
  instructions: string
  questions: ShortAnswerQuestion[]
}

export type ExamPaperSection = MultipleChoiceSection | MatchingSection | ShortAnswerSection

export interface ExamPaper {
  id: string
  school_class_id: string
  subject_id: string
  created_by: string
  title: string
  exam_date: string | null
  duration_minutes: number
  instructions: string
  sections: ExamPaperSection[]
  total_marks: number
  status: 'draft' | 'finalized'
  created_at: string
  updated_at: string
}

export interface SectionRequest {
  type: ExamPaperSectionType
  count: number
  marks_per_question: number
}

export interface GenerateExamPaperInput {
  subject_id: string
  school_class_id: string
  title: string
  exam_date?: string
  duration_minutes: number
  sections: SectionRequest[]
  notes?: string
}

export interface UpdateExamPaperInput {
  title?: string
  exam_date?: string | null
  duration_minutes?: number
  instructions?: string
  sections?: ExamPaperSection[]
}
