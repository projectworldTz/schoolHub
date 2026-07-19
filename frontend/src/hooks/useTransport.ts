import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  assignTransport,
  listTransportAssignments,
  transportRoutesApi,
  unassignTransport,
  type AssignTransportPayload,
  type TransportRoutePayload,
} from '@/api/transport'
import type { TransportRoute } from '@/types/transport'

export const useTransportRoutes = createCrudHooks<TransportRoute, TransportRoutePayload>(
  'transport-routes',
  transportRoutesApi
)

const ASSIGNMENTS_KEY = ['school', 'transport-assignments'] as const

export function useTransportAssignments() {
  return useQuery({ queryKey: ASSIGNMENTS_KEY, queryFn: listTransportAssignments })
}

export function useAssignTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssignTransportPayload) => assignTransport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'transport-routes'] })
    },
  })
}

export function useUnassignTransport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: unassignTransport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSIGNMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'transport-routes'] })
    },
  })
}
