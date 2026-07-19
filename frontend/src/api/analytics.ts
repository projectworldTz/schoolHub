import { apiClient } from '@/api/client'
import type {
  AcademicsReport,
  AttendanceReport,
  BranchComparisonRow,
  BudgetReport,
  DateRangeKey,
  EnrollmentReport,
  FinanceReport,
  OverviewReport,
  StaffAttendanceReport,
} from '@/types/analytics'

export interface RangeParams {
  range?: DateRangeKey
  from?: string
  to?: string
}

export async function fetchOverviewReport(params: RangeParams = {}): Promise<OverviewReport> {
  const { data } = await apiClient.get<{ data: OverviewReport }>('/school/analytics/overview', { params })
  return data.data
}

export async function fetchEnrollmentReport(): Promise<EnrollmentReport> {
  const { data } = await apiClient.get<{ data: EnrollmentReport }>('/school/analytics/enrollment')
  return data.data
}

export async function fetchAttendanceReport(params: RangeParams = {}): Promise<AttendanceReport> {
  const { data } = await apiClient.get<{ data: AttendanceReport }>('/school/analytics/attendance', { params })
  return data.data
}

export async function fetchAcademicsReport(examId?: string): Promise<AcademicsReport> {
  const { data } = await apiClient.get<{ data: AcademicsReport }>('/school/analytics/academics', {
    params: examId ? { exam_id: examId } : {},
  })
  return data.data
}

export async function fetchFinanceReport(params: RangeParams & { academic_year_id?: string } = {}): Promise<FinanceReport> {
  const { data } = await apiClient.get<{ data: FinanceReport }>('/school/analytics/finance', { params })
  return data.data
}

export async function fetchBudgetReport(academicYearId?: string): Promise<BudgetReport> {
  const { data } = await apiClient.get<{ data: BudgetReport }>('/school/analytics/budget', {
    params: academicYearId ? { academic_year_id: academicYearId } : {},
  })
  return data.data
}

export async function fetchStaffAttendanceReport(params: RangeParams = {}): Promise<StaffAttendanceReport> {
  const { data } = await apiClient.get<{ data: StaffAttendanceReport }>('/school/analytics/staff-attendance', {
    params,
  })
  return data.data
}

export async function fetchBranchComparison(): Promise<BranchComparisonRow[]> {
  const { data } = await apiClient.get<{ data: BranchComparisonRow[] }>('/school/analytics/by-branch')
  return data.data
}
