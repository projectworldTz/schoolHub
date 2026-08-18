export interface AcademicYearSummary {
  id: string
  name: string
}

export interface PromotionPreviewStudent {
  student_id: string
  name: string
  admission_number: string
  already_promoted: boolean
}

export interface PromotionPreviewClass {
  from_school_class_id: string
  from_school_class_name: string
  to_school_class_id: string | null
  to_school_class_name: string | null
  is_terminal: boolean
  students: PromotionPreviewStudent[]
}

export interface PromotionManualClass {
  school_class_id: string
  school_class_name: string
  student_count: number
}

export interface PromotionPreview {
  from_academic_year: AcademicYearSummary | null
  to_academic_year: AcademicYearSummary | null
  classes: PromotionPreviewClass[]
  manual_classes: PromotionManualClass[]
}

export interface PromotionDecision {
  student_id: string
  to_school_class_id?: string
  graduate?: boolean
}

export type PromotionMode = 'automatic' | 'manual'

export interface PromotionCommitPayload {
  from_academic_year_id?: string
  to_academic_year_id: string
  mode: PromotionMode
  decisions: PromotionDecision[]
}

export type PromotionResultStatus = 'promoted' | 'repeated' | 'graduated' | 'skipped' | 'error'

export interface PromotionResult {
  total: number
  promoted_count: number
  repeated_count: number
  graduated_count: number
  skipped_count: number
  results: { student_id: string | null; status: PromotionResultStatus; message?: string }[]
}

export interface StudentPromotionRecord {
  id: string
  student_id: string
  student_name?: string
  student_admission_number?: string
  from_academic_year_name?: string | null
  to_academic_year_name?: string
  from_school_class_name?: string | null
  to_school_class_name?: string | null
  action: 'promoted' | 'repeated' | 'graduated'
  mode: PromotionMode
  promoted_by_name?: string | null
  promoted_at: string
}
