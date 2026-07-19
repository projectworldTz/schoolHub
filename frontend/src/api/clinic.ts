import { createCrudApi } from '@/api/crud'
import type { ClinicVisit } from '@/types/clinic'

export interface ClinicVisitPayload {
  student_id: string
  visit_date: string
  reason: string
  diagnosis?: string
  treatment?: string
  follow_up_date?: string
}

export const clinicVisitsApi = createCrudApi<ClinicVisit, ClinicVisitPayload>('clinic-visits')
