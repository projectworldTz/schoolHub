import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { HostelAllocation, HostelRoom } from '@/types/hostel'

export interface HostelRoomPayload {
  name: string
  type: string
  capacity: number
}

export const hostelRoomsApi = createCrudApi<HostelRoom, HostelRoomPayload>('hostel-rooms')

export async function listHostelAllocations(): Promise<HostelAllocation[]> {
  const { data } = await apiClient.get<{ data: HostelAllocation[] }>('/school/hostel-allocations')
  return data.data
}

export interface AllocateHostelRoomPayload {
  student_id: string
  hostel_room_id: string
  academic_year_id: string
  allocated_at?: string
}

export async function allocateHostelRoom(payload: AllocateHostelRoomPayload): Promise<HostelAllocation> {
  const { data } = await apiClient.post<{ data: HostelAllocation }>('/school/hostel-allocations', payload)
  return data.data
}

export async function vacateHostelAllocation(allocationId: string): Promise<HostelAllocation> {
  const { data } = await apiClient.post<{ data: HostelAllocation }>(
    `/school/hostel-allocations/${allocationId}/vacate`
  )
  return data.data
}
