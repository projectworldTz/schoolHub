export type DisciplineSeverity = 'minor' | 'moderate' | 'major'
export type DisciplineStatus = 'open' | 'resolved'

export interface DisciplineIncident {
  id: string
  student_id: string
  student_name?: string
  incident_date: string
  category: string
  severity: DisciplineSeverity
  description: string
  action_taken: string | null
  status: DisciplineStatus
  reported_by_name?: string
}
