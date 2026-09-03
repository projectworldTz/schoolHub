import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { TeacherAvailability, TimetableEntry, TimetablePeriod, TimetableSubstitution } from '@/types/timetable'

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

export async function updateTimetableEntry(id: string, payload: TimetableEntryPayload): Promise<TimetableEntry> {
  const { data } = await apiClient.put<{ data: TimetableEntry }>(`/school/timetable-entries/${id}`, payload)
  return data.data
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  await apiClient.delete(`/school/timetable-entries/${id}`)
}

export interface TimetableGenerationPayload {
  academic_year_id: string
  days?: string[]
  assignments: Array<Omit<TimetableEntryPayload, 'academic_year_id' | 'timetable_period_id' | 'day_of_week'> & {
    periods_per_week: number
    double_periods?: number
  }>
  unavailable?: Array<{ teacher_id: string; day_of_week: string; timetable_period_id: string }>
}

export async function generateTimetable(payload: TimetableGenerationPayload): Promise<TimetableEntry[]> {
  const { data } = await apiClient.post<{ data: TimetableEntry[] }>('/school/timetable-entries/generate', payload)
  return data.data
}

export async function listTeacherAvailability(teacherId: string, yearId: string): Promise<TeacherAvailability[]> {
  const { data } = await apiClient.get<{ data: TeacherAvailability[] }>('/school/teacher-availabilities', { params: { teacher_id: teacherId, academic_year_id: yearId } })
  return data.data
}

export async function saveTeacherAvailability(payload: { teacher_id: string; academic_year_id: string; unavailable_slots: Array<{ day_of_week: string; timetable_period_id: string }> }): Promise<void> {
  await apiClient.put('/school/teacher-availabilities', payload)
}

export async function listSubstitutions(): Promise<TimetableSubstitution[]> {
  const { data } = await apiClient.get<{ data: TimetableSubstitution[] }>('/school/timetable-substitutions')
  return data.data
}

export async function createSubstitution(payload: { timetable_entry_id: string; substitute_teacher_id: string; date: string; reason?: string }): Promise<TimetableSubstitution> {
  const { data } = await apiClient.post<{ data: TimetableSubstitution }>('/school/timetable-substitutions', payload)
  return data.data
}

export async function deleteSubstitution(id: string): Promise<void> {
  await apiClient.delete(`/school/timetable-substitutions/${id}`)
}
