import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { TimetableEntry, TimetablePeriod } from '@/types/timetable'

export const timetablePeriodsApi = createCrudApi<TimetablePeriod>('timetable-periods')

export interface TimetableEntryPayload {
  school_class_id: string
  stream_id?: string
  subject_id: string
  teacher_id: string
  room_id?: string
  timetable_period_id: string
  academic_year_id: string
  day_of_week: string
}

export interface ListTimetableEntriesParams {
  school_class_id?: string
  teacher_id?: string
  academic_year_id?: string
}

export async function listTimetableEntries(params: ListTimetableEntriesParams): Promise<TimetableEntry[]> {
  const { data } = await apiClient.get<{ data: TimetableEntry[] }>('/school/timetable-entries', { params })
  return data.data
}

export async function createTimetableEntry(payload: TimetableEntryPayload): Promise<TimetableEntry> {
  const { data } = await apiClient.post<{ data: TimetableEntry }>('/school/timetable-entries', payload)
  return data.data
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  await apiClient.delete(`/school/timetable-entries/${id}`)
}
