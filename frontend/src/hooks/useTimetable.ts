import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  createTimetableEntry,
  deleteTimetableEntry,
  listTimetableEntries,
  timetablePeriodsApi,
  updateTimetableEntry,
  type ListTimetableEntriesParams,
  type TimetableEntryPayload,
} from '@/api/timetable'
import type { TimetablePeriod } from '@/types/timetable'

export const useTimetablePeriods = createCrudHooks<TimetablePeriod>('timetable-periods', timetablePeriodsApi)

const ENTRIES_KEY = ['school', 'timetable-entries'] as const

export function useTimetableEntries(params: ListTimetableEntriesParams) {
  return useQuery({
    queryKey: [...ENTRIES_KEY, params],
    queryFn: () => listTimetableEntries(params),
    enabled: Boolean(params.school_class_id && params.academic_year_id),
  })
}

export function useCreateTimetableEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TimetableEntryPayload) => createTimetableEntry(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  })
}

export function useDeleteTimetableEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTimetableEntry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  })
}

export function useUpdateTimetableEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TimetableEntryPayload }) =>
      updateTimetableEntry(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  })
}
