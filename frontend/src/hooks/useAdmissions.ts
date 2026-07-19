import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptAdmission,
  createAdmission,
  enrollAdmission,
  listAdmissions,
  rejectAdmission,
  type AdmissionPayload,
} from '@/api/admissions'

const ADMISSIONS_KEY = ['school', 'admissions'] as const

export function useAdmissions(status = '') {
  return useQuery({ queryKey: [...ADMISSIONS_KEY, status], queryFn: () => listAdmissions(status) })
}

export function useCreateAdmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdmissionPayload) => createAdmission(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMISSIONS_KEY }),
  })
}

export function useAcceptAdmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acceptAdmission,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMISSIONS_KEY }),
  })
}

export function useRejectAdmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => rejectAdmission(id, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMISSIONS_KEY }),
  })
}

export function useEnrollAdmission() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: enrollAdmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMISSIONS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'students'] })
    },
  })
}
