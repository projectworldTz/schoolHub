import { useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useReport } from '@/hooks/useReports'
import { downloadCsv } from '@/lib/csv'

export function ReportDetailPage() {
  const { key } = useParams<{ key: string }>()
  const { data, isLoading } = useReport(key ?? '')

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={data.title} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{data.title}</h1>
          {data.context && (
            <p className="mt-1 text-sm text-muted-foreground">
              <Badge variant="outline">{data.context}</Badge>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCsv(`${data.key}.csv`, data.columns, data.rows)}
          disabled={data.rows.length === 0}
        >
          <Download className="size-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data.rows.length} rows</CardTitle>
          <CardDescription>Generated just now from live data.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((col) => (
                  <TableHead key={col.key}>{col.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={data.columns.length} className="text-center text-muted-foreground">
                    No data yet for this report.
                  </TableCell>
                </TableRow>
              )}
              {data.rows.map((row, i) => (
                <TableRow key={i}>
                  {data.columns.map((col) => (
                    <TableCell key={col.key}>{row[col.key] ?? '—'}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
