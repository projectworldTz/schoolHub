import { createCrudHooks } from '@/hooks/useCrud'
import { clinicVisitsApi, type ClinicVisitPayload } from '@/api/clinic'
import type { ClinicVisit } from '@/types/clinic'

export const useClinicVisits = createCrudHooks<ClinicVisit, ClinicVisitPayload>('clinic-visits', clinicVisitsApi)
