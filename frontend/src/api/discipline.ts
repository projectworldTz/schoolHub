import { createCrudApi } from '@/api/crud'
import type { DisciplineIncident, DisciplineSeverity, DisciplineStatus } from '@/types/discipline'

export interface DisciplineIncidentPayload {
  student_id: string
  incident_date: string
  category: string
  severity: DisciplineSeverity
  description: string
  action_taken?: string
  status?: DisciplineStatus
}

export const disciplineIncidentsApi = createCrudApi<DisciplineIncident, DisciplineIncidentPayload>('discipline-incidents')
