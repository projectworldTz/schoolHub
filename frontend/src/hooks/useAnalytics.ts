import { useQuery } from '@tanstack/react-query'
import {
  fetchAcademicsReport,
  fetchAttendanceReport,
  fetchBranchComparison,
  fetchBudgetReport,
  fetchEnrollmentReport,
  fetchFinanceReport,
  fetchOverviewReport,
  fetchStaffAttendanceReport,
  type RangeParams,
} from '@/api/analytics'

export function useOverviewReport(params: RangeParams = {}) {
  return useQuery({ queryKey: ['school', 'analytics', 'overview', params], queryFn: () => fetchOverviewReport(params) })
}

export function useEnrollmentReport() {
  return useQuery({ queryKey: ['school', 'analytics', 'enrollment'], queryFn: fetchEnrollmentReport })
}

export function useAttendanceReport(params: RangeParams = {}) {
  return useQuery({
    queryKey: ['school', 'analytics', 'attendance', params],
    queryFn: () => fetchAttendanceReport(params),
  })
}

export function useAcademicsReport(examId?: string) {
  return useQuery({
    queryKey: ['school', 'analytics', 'academics', examId],
    queryFn: () => fetchAcademicsReport(examId),
  })
}

export function useFinanceReport(params: RangeParams & { academic_year_id?: string } = {}) {
  return useQuery({
    queryKey: ['school', 'analytics', 'finance', params],
    queryFn: () => fetchFinanceReport(params),
  })
}

export function useBudgetReport(academicYearId?: string) {
  return useQuery({
    queryKey: ['school', 'analytics', 'budget', academicYearId],
    queryFn: () => fetchBudgetReport(academicYearId),
  })
}

export function useStaffAttendanceReport(params: RangeParams = {}) {
  return useQuery({
    queryKey: ['school', 'analytics', 'staff-attendance', params],
    queryFn: () => fetchStaffAttendanceReport(params),
  })
}

export function useBranchComparison() {
  return useQuery({ queryKey: ['school', 'analytics', 'by-branch'], queryFn: fetchBranchComparison })
}
