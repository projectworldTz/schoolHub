import { apiClient, apiOrigin } from '@/api/client'
import type {
  ClassRankingRow,
  ClassSummary,
  Exam,
  ExamStatus,
  ExamSubject,
  ExamType,
  ReportCard,
  TeacherPerformanceRow,
} from '@/types/exams'

export interface ExamPayload {
  academic_year_id: string
  term_id?: string
  name: string
  exam_type: ExamType
  start_date?: string
  end_date?: string
  status?: string
}

export async function listExams(academicYearId?: string): Promise<Exam[]> {
  const { data } = await apiClient.get<{ data: Exam[] }>('/school/exams', {
    params: academicYearId ? { academic_year_id: academicYearId } : {},
  })
  return data.data
}

export async function fetchExam(id: string): Promise<Exam> {
  const { data } = await apiClient.get<{ data: Exam }>(`/school/exams/${id}`)
  return data.data
}

export async function updateExamStatus(id: string, status: ExamStatus): Promise<Exam> {
  const { data } = await apiClient.put<{ data: Exam }>(`/school/exams/${id}/status`, { status })
  return data.data
}

export async function createExam(payload: ExamPayload): Promise<Exam> {
  const { data } = await apiClient.post<{ data: Exam }>('/school/exams', payload)
  return data.data
}

export async function deleteExam(id: string): Promise<void> {
  await apiClient.delete(`/school/exams/${id}`)
}

export interface ExamSubjectPayload {
  school_class_id: string
  subject_id: string
  max_marks: number
  pass_marks?: number
  exam_date?: string
}

export async function addExamSubject(examId: string, payload: ExamSubjectPayload): Promise<ExamSubject> {
  const { data } = await apiClient.post<{ data: ExamSubject }>(`/school/exams/${examId}/subjects`, payload)
  return data.data
}

export async function fetchExamSubject(id: string): Promise<ExamSubject> {
  const { data } = await apiClient.get<{ data: ExamSubject }>(`/school/exam-subjects/${id}`)
  return data.data
}

export async function deleteExamSubject(id: string): Promise<void> {
  await apiClient.delete(`/school/exam-subjects/${id}`)
}

export interface RecordMarksPayload {
  records: { student_id: string; marks_obtained: number | null; remarks?: string }[]
}

export async function recordExamMarks(examSubjectId: string, payload: RecordMarksPayload) {
  const { data } = await apiClient.put(`/school/exam-subjects/${examSubjectId}/results`, payload)
  return data.data
}

export async function fetchReportCard(studentId: string, examId: string): Promise<ReportCard> {
  const { data } = await apiClient.get<{ data: ReportCard }>(`/school/students/${studentId}/report-card`, {
    params: { exam_id: examId },
  })
  return data.data
}

export async function fetchClassRanking(examId: string, schoolClassId: string): Promise<ClassRankingRow[]> {
  const { data } = await apiClient.get<{ data: ClassRankingRow[] }>(`/school/exams/${examId}/report-cards/ranking`, {
    params: { school_class_id: schoolClassId },
  })
  return data.data
}

export function reportCardPdfUrl(studentId: string, examId: string): string {
  return `${apiOrigin}/api/school/students/${studentId}/report-card/pdf?exam_id=${examId}`
}

export function bulkReportCardPdfUrl(examId: string, schoolClassId: string): string {
  return `${apiOrigin}/api/school/exams/${examId}/report-cards/pdf?school_class_id=${schoolClassId}`
}

export async function setReportCardRemark(examId: string, studentId: string, remark: string): Promise<void> {
  await apiClient.put(`/school/exams/${examId}/students/${studentId}/remark`, { remark })
}

export async function fetchClassSummary(examId: string, schoolClassId: string): Promise<ClassSummary> {
  const { data } = await apiClient.get<{ data: ClassSummary }>(`/school/exams/${examId}/report-cards/class-summary`, {
    params: { school_class_id: schoolClassId },
  })
  return data.data
}

export async function fetchTeacherPerformance(examId: string): Promise<TeacherPerformanceRow[]> {
  const { data } = await apiClient.get<{ data: TeacherPerformanceRow[] }>(`/school/exams/${examId}/teacher-performance`)
  return data.data
}
