import type { StudentDocument } from '@/types/students'

export type AdmissionStatus = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'enrolled'

export interface AdmissionApplication {
  id: string
  academic_year_id: string
  academic_year_name?: string
  applying_for_class_id: string
  applying_for_class_name?: string
  branch_name?: string | null
  applicant_first_name: string
  applicant_last_name: string
  date_of_birth: string | null
  gender: string | null
  guardian_name: string
  guardian_phone: string
  guardian_email: string | null
  status: AdmissionStatus
  notes: string | null
  student_id: string | null
  reviewed_by: string | null
  reviewer_name?: string | null
  reviewed_at: string | null
  documents?: StudentDocument[]
  created_at: string
}
