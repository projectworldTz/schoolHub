import { apiClient, apiOrigin } from '@/api/client'
import type { ExamPaper, GenerateExamPaperInput, UpdateExamPaperInput } from '@/types/examPaper'

export async function generateExamPaper(input: GenerateExamPaperInput): Promise<ExamPaper> {
  const { data } = await apiClient.post<{ data: ExamPaper }>('/school/exam-papers/generate', input)
  return data.data
}

export async function fetchExamPaper(id: string): Promise<ExamPaper> {
  const { data } = await apiClient.get<{ data: ExamPaper }>(`/school/exam-papers/${id}`)
  return data.data
}

export async function updateExamPaper(id: string, input: UpdateExamPaperInput): Promise<ExamPaper> {
  const { data } = await apiClient.patch<{ data: ExamPaper }>(`/school/exam-papers/${id}`, input)
  return data.data
}

export async function refineExamPaper(id: string, instruction: string): Promise<ExamPaper> {
  const { data } = await apiClient.post<{ data: ExamPaper }>(`/school/exam-papers/${id}/refine`, { instruction })
  return data.data
}

export async function finalizeExamPaper(id: string): Promise<ExamPaper> {
  const { data } = await apiClient.post<{ data: ExamPaper }>(`/school/exam-papers/${id}/finalize`)
  return data.data
}

export function examPaperPdfUrl(id: string, type: 'paper' | 'marking-scheme'): string {
  return `${apiOrigin}/api/school/exam-papers/${id}/pdf/${type}`
}
