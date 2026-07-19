import { useQuery } from '@tanstack/react-query'
import { fetchReport, fetchReportCatalog } from '@/api/reports'

export function useReportCatalog() {
  return useQuery({ queryKey: ['school', 'reports'], queryFn: fetchReportCatalog })
}

export function useReport(key: string) {
  return useQuery({ queryKey: ['school', 'reports', key], queryFn: () => fetchReport(key), enabled: Boolean(key) })
}
