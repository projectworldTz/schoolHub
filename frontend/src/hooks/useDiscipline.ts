import { createCrudHooks } from '@/hooks/useCrud'
import { disciplineIncidentsApi, type DisciplineIncidentPayload } from '@/api/discipline'
import type { DisciplineIncident } from '@/types/discipline'

export const useDisciplineIncidents = createCrudHooks<DisciplineIncident, DisciplineIncidentPayload>(
  'discipline-incidents',
  disciplineIncidentsApi,
)
