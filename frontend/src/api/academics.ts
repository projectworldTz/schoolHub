import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { GradingSystem, Room, SchoolClass, Stream, Subject } from '@/types/academics'

export interface GradingSystemPayload {
  name: string
  is_default: boolean
  grade_bands: { label: string; min_score: number; max_score: number }[]
}

export const classesApi = createCrudApi<SchoolClass>('classes')
export const streamsApi = createCrudApi<Stream>('streams')
export const roomsApi = createCrudApi<Room>('rooms')
export const subjectsApi = createCrudApi<Subject>('subjects')
export const gradingSystemsApi = createCrudApi<GradingSystem, GradingSystemPayload>('grading-systems')

export async function syncClassSubjects(classId: string, subjectIds: string[]): Promise<SchoolClass> {
  const { data } = await apiClient.put<{ data: SchoolClass }>(`/school/classes/${classId}/subjects`, {
    subject_ids: subjectIds,
  })
  return data.data
}
