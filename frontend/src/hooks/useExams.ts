import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addExamSubject,
  createExam,
  deleteExam,
  deleteExamSubject,
  fetchClassRanking,
  fetchClassSummary,
  fetchExam,
  fetchExamSubject,
  fetchReportCard,
  fetchTeacherPerformance,
  listExams,
  recordExamMarks,
  setReportCardRemark,
  updateExamStatus,
  type ExamPayload,
  type ExamSubjectPayload,
  type RecordMarksPayload,
} from '@/api/exams'
import type { ExamStatus } from '@/types/exams'

const EXAMS_KEY = ['school', 'exams'] as const

export function useExams(academicYearId?: string) {
  return useQuery({ queryKey: [...EXAMS_KEY, academicYearId], queryFn: () => listExams(academicYearId) })
}

export function useExam(id: string) {
  return useQuery({ queryKey: [...EXAMS_KEY, id], queryFn: () => fetchExam(id), enabled: Boolean(id) })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExamPayload) => createExam(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAMS_KEY }),
  })
}

export function useDeleteExam() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAMS_KEY }),
  })
}

export function useUpdateExamStatus(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (status: ExamStatus) => updateExamStatus(examId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: EXAMS_KEY }),
  })
}

export function useAddExamSubject(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExamSubjectPayload) => addExamSubject(examId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...EXAMS_KEY, examId] }),
  })
}

export function useDeleteExamSubject(examId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteExamSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...EXAMS_KEY, examId] }),
  })
}

export function useExamSubject(id: string) {
  return useQuery({
    queryKey: ['school', 'exam-subjects', id],
    queryFn: () => fetchExamSubject(id),
    enabled: Boolean(id),
  })
}

export function useRecordExamMarks(examSubjectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecordMarksPayload) => recordExamMarks(examSubjectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'exam-subjects', examSubjectId] }),
  })
}

export function useReportCard(studentId: string, examId: string) {
  return useQuery({
    queryKey: ['school', 'report-card', studentId, examId],
    queryFn: () => fetchReportCard(studentId, examId),
    enabled: Boolean(studentId && examId),
  })
}

export function useClassRanking(examId: string, schoolClassId: string) {
  return useQuery({
    queryKey: ['school', 'report-cards', 'ranking', examId, schoolClassId],
    queryFn: () => fetchClassRanking(examId, schoolClassId),
    enabled: Boolean(examId && schoolClassId),
  })
}

export function useClassSummary(examId: string, schoolClassId: string) {
  return useQuery({
    queryKey: ['school', 'report-cards', 'class-summary', examId, schoolClassId],
    queryFn: () => fetchClassSummary(examId, schoolClassId),
    enabled: Boolean(examId && schoolClassId),
  })
}

export function useTeacherPerformance(examId: string) {
  return useQuery({
    queryKey: ['school', 'exams', examId, 'teacher-performance'],
    queryFn: () => fetchTeacherPerformance(examId),
    enabled: Boolean(examId),
  })
}

export function useSetReportCardRemark(examId: string, studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (remark: string) => setReportCardRemark(examId, studentId, remark),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school', 'report-card', studentId, examId] }),
  })
}
