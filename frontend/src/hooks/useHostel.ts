import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  allocateHostelRoom,
  hostelRoomsApi,
  listHostelAllocations,
  vacateHostelAllocation,
  type AllocateHostelRoomPayload,
  type HostelRoomPayload,
} from '@/api/hostel'
import type { HostelRoom } from '@/types/hostel'

export const useHostelRooms = createCrudHooks<HostelRoom, HostelRoomPayload>('hostel-rooms', hostelRoomsApi)

const ALLOCATIONS_KEY = ['school', 'hostel-allocations'] as const

export function useHostelAllocations() {
  return useQuery({ queryKey: ALLOCATIONS_KEY, queryFn: listHostelAllocations })
}

export function useAllocateHostelRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AllocateHostelRoomPayload) => allocateHostelRoom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'hostel-rooms'] })
    },
  })
}

export function useVacateHostelAllocation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: vacateHostelAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'hostel-rooms'] })
    },
  })
}
