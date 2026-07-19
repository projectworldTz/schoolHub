import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { TransportAssignment, TransportRoute } from '@/types/transport'

export interface TransportRoutePayload {
  name: string
  vehicle_registration?: string
  driver_name?: string
  driver_phone?: string
  capacity?: number
}

export const transportRoutesApi = createCrudApi<TransportRoute, TransportRoutePayload>('transport-routes')

export async function listTransportAssignments(): Promise<TransportAssignment[]> {
  const { data } = await apiClient.get<{ data: TransportAssignment[] }>('/school/transport-assignments')
  return data.data
}

export interface AssignTransportPayload {
  student_id: string
  transport_route_id: string
  academic_year_id: string
  pickup_point?: string
}

export async function assignTransport(payload: AssignTransportPayload): Promise<TransportAssignment> {
  const { data } = await apiClient.post<{ data: TransportAssignment }>('/school/transport-assignments', payload)
  return data.data
}

export async function unassignTransport(assignmentId: string): Promise<TransportAssignment> {
  const { data } = await apiClient.post<{ data: TransportAssignment }>(
    `/school/transport-assignments/${assignmentId}/unassign`
  )
  return data.data
}
