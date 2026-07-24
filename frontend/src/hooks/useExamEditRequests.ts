import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createExamEditRequest,
  deleteExamEditRequest,
  listExamEditRequests,
  reviewExamEditRequest,
} from '@/api/examEditRequests'
import type { ExamEditRequestStatus } from '@/types/exams'

const EXAM_EDIT_REQUESTS_KEY = ['school', 'exam-edit-requests'] as const

export function useExamEditRequests() {
  return useQuery({ queryKey: EXAM_EDIT_REQUESTS_KEY, queryFn: listExamEditRequests })
}

export function useCreateExamEditRequest(examSubjectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason: string) => createExamEditRequest(examSubjectId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAM_EDIT_REQUESTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'exam-subjects', examSubjectId] })
    },
  })
}

export function useReviewExamEditRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExamEditRequestStatus }) => reviewExamEditRequest(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAM_EDIT_REQUESTS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'exam-subjects'] })
    },
  })
}

export function useDeleteExamEditRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExamEditRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAM_EDIT_REQUESTS_KEY }),
  })
}
