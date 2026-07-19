export interface ReportMeta {
  key: string
  title: string
  description: string
  category: string
  permission: string
}

export interface ReportColumn {
  key: string
  label: string
}

export interface ReportData {
  key: string
  title: string
  columns: ReportColumn[]
  rows: Record<string, string | number>[]
  context?: string
}
