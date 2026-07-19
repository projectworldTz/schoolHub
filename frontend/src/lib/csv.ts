import type { ReportColumn } from '@/types/reports'

export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function downloadCsv(filename: string, columns: ReportColumn[], rows: Record<string, string | number>[]) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',')
  const body = rows.map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(',')).join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
