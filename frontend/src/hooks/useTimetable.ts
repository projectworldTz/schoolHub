import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  createTimetableEntry,
  deleteTimetableEntry,
  listTimetableEntries,
  timetablePeriodsApi,
  updateTimetableEntry,
  generateTimetable,
  type TimetableGenerationPayload,
  listTeacherAvailability,
  saveTeacherAvailability,
  listSubstitutions,
  createSubstitution,
  deleteSubstitution,
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

export function useGenerateTimetable() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: TimetableGenerationPayload) => generateTimetable(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  })
}

export function useTeacherAvailability(teacherId: string, yearId: string) {
  return useQuery({ queryKey: ['school', 'teacher-availability', teacherId, yearId], queryFn: () => listTeacherAvailability(teacherId, yearId), enabled: Boolean(teacherId && yearId) })
}

export function useSaveTeacherAvailability() {
  const client = useQueryClient()
  return useMutation({ mutationFn: saveTeacherAvailability, onSuccess: () => client.invalidateQueries({ queryKey: ['school', 'teacher-availability'] }) })
}

export function useSubstitutions() {
  const client = useQueryClient()
  const list = useQuery({ queryKey: ['school', 'timetable-substitutions'], queryFn: listSubstitutions })
  const create = useMutation({ mutationFn: createSubstitution, onSuccess: () => client.invalidateQueries({ queryKey: ['school', 'timetable-substitutions'] }) })
  const remove = useMutation({ mutationFn: deleteSubstitution, onSuccess: () => client.invalidateQueries({ queryKey: ['school', 'timetable-substitutions'] }) })
  return { list, create, remove }
}
