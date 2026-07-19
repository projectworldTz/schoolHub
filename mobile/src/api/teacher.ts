import { apiClient } from './client'
import type {
  AcademicYearSummary,
  AttendanceRosterRow,
  AttendanceStatus,
  ExamDetail,
  ExamResultRow,
  ExamSubjectSummary,
  ExamSummary,
  SchoolClassSummary,
} from '../types/teacher'

export async function fetchClasses(): Promise<SchoolClassSummary[]> {
  const { data } = await apiClient.get<{ data: SchoolClassSummary[] }>('/school/classes')
  return data.data
}

export async function fetchAcademicYears(): Promise<AcademicYearSummary[]> {
  const { data } = await apiClient.get<{ data: AcademicYearSummary[] }>('/school/academic-years')
  return data.data
}

/** Same "is_current, else most recent by start_date" fallback used server-side throughout. */
export function resolveCurrentAcademicYearId(years: AcademicYearSummary[]): string | null {
  const current = years.find((y) => y.is_current)
  if (current) return current.id
  const sorted = [...years].sort((a, b) => b.start_date.localeCompare(a.start_date))
  return sorted[0]?.id ?? null
}

export interface AttendanceRegisterParams {
  school_class_id: string
  academic_year_id: string
  date: string
}

export async function fetchAttendanceRegister(params: AttendanceRegisterParams): Promise<AttendanceRosterRow[]> {
  const { data } = await apiClient.get<{ data: AttendanceRosterRow[] }>('/school/attendance/register', { params })
  return data.data
}

export interface SaveAttendancePayload {
  school_class_id: string
  academic_year_id: string
  date: string
  records: { student_id: string; status: AttendanceStatus; remarks?: string }[]
}

export async function saveAttendance(payload: SaveAttendancePayload): Promise<void> {
  await apiClient.post('/school/attendance', payload)
}

export async function fetchExams(academicYearId?: string): Promise<ExamSummary[]> {
  const { data } = await apiClient.get<{ data: ExamSummary[] }>('/school/exams', {
    params: academicYearId ? { academic_year_id: academicYearId } : {},
  })
  return data.data
}

export async function fetchExam(examId: string): Promise<ExamDetail> {
  const { data } = await apiClient.get<{ data: ExamDetail }>(`/school/exams/${examId}`)
  return data.data
}

export interface ExamSubjectWithResults extends ExamSubjectSummary {
  results: ExamResultRow[]
}

export async function fetchExamSubject(examSubjectId: string): Promise<ExamSubjectWithResults> {
  const { data } = await apiClient.get<{ data: ExamSubjectWithResults }>(`/school/exam-subjects/${examSubjectId}`)
  return data.data
}

export interface SaveExamMarksPayload {
  records: { student_id: string; marks_obtained: number | null; remarks?: string }[]
}

export async function saveExamMarks(examSubjectId: string, payload: SaveExamMarksPayload): Promise<void> {
  await apiClient.put(`/school/exam-subjects/${examSubjectId}/results`, payload)
}
