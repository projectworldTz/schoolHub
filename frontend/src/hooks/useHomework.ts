import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createHomework,
  deleteHomework,
  fetchHomework,
  gradeSubmission,
  listHomeworks,
  type GradeSubmissionPayload,
  type HomeworkPayload,
  type ListHomeworksParams,
} from '@/api/homework'

const HOMEWORK_KEY = ['school', 'homeworks'] as const

export function useHomeworks(params: ListHomeworksParams = {}) {
  return useQuery({ queryKey: [...HOMEWORK_KEY, params], queryFn: () => listHomeworks(params) })
}

export function useHomework(id: string) {
  return useQuery({
    queryKey: [...HOMEWORK_KEY, id],
    queryFn: () => fetchHomework(id),
    enabled: Boolean(id),
  })
}

export function useCreateHomework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: HomeworkPayload) => createHomework(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HOMEWORK_KEY }),
  })
}

export function useDeleteHomework() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteHomework,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HOMEWORK_KEY }),
  })
}

export function useGradeSubmission(homeworkId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GradeSubmissionPayload }) => gradeSubmission(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...HOMEWORK_KEY, homeworkId] }),
  })
}
