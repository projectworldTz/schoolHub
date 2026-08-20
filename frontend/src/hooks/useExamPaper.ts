import { useMutation } from '@tanstack/react-query'
import { finalizeExamPaper, generateExamPaper, refineExamPaper, updateExamPaper } from '@/api/examPaper'

export function useGenerateExamPaper() {
  return useMutation({ mutationFn: generateExamPaper })
}

export function useUpdateExamPaper() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateExamPaper>[1] }) => updateExamPaper(id, input),
  })
}

export function useRefineExamPaper() {
  return useMutation({
    mutationFn: ({ id, instruction }: { id: string; instruction: string }) => refineExamPaper(id, instruction),
  })
}

export function useFinalizeExamPaper() {
  return useMutation({ mutationFn: finalizeExamPaper })
}
