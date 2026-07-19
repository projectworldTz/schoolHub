import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  classesApi,
  gradingSystemsApi,
  roomsApi,
  streamsApi,
  subjectsApi,
  syncClassSubjects,
  type GradingSystemPayload,
} from '@/api/academics'
import type { GradingSystem, Room, SchoolClass, Stream, Subject } from '@/types/academics'

export const useClasses = createCrudHooks<SchoolClass>('classes', classesApi)
export const useStreams = createCrudHooks<Stream>('streams', streamsApi)
export const useRooms = createCrudHooks<Room>('rooms', roomsApi)
export const useSubjects = createCrudHooks<Subject>('subjects', subjectsApi)
export const useGradingSystems = createCrudHooks<GradingSystem, GradingSystemPayload>(
  'grading-systems',
  gradingSystemsApi
)

export function useSyncClassSubjects() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) =>
      syncClassSubjects(classId, subjectIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'classes'] }),
  })
}
