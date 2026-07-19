export interface ClinicVisit {
  id: string
  student_id: string
  student_name?: string
  visit_date: string
  reason: string
  diagnosis: string | null
  treatment: string | null
  follow_up_date: string | null
  recorded_by_name?: string
}
