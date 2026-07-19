import { apiClient } from '@/api/client'
import type { ReportData, ReportMeta } from '@/types/reports'

export async function fetchReportCatalog(): Promise<ReportMeta[]> {
  const { data } = await apiClient.get<{ data: ReportMeta[] }>('/school/reports')
  return data.data
}

export async function fetchReport(key: string): Promise<ReportData> {
  const { data } = await apiClient.get<{ data: ReportData }>(`/school/reports/${key}`)
  return data.data
}
