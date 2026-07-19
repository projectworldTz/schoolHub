import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useActivityLogs, useActivityLogSubjectTypes } from '@/hooks/useActivityLog'
import type { ActivityLogAction, ActivityLogEntry } from '@/types/activityLog'

const ACTION_VARIANT: Record<ActivityLogAction, 'default' | 'secondary' | 'destructive'> = {
  created: 'default',
  updated: 'secondary',
  deleted: 'destructive',
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function ChangesSummary({ entry }: { entry: ActivityLogEntry }) {
  if (!entry.changes) return <span className="text-muted-foreground">—</span>
  return (
    <ul className="space-y-0.5">
      {Object.entries(entry.changes).map(([field, change]) => (
        <li key={field} className="text-xs">
          <span className="font-medium">{field}:</span> {formatValue(change.old)} → {formatValue(change.new)}
        </li>
      ))}
    </ul>
  )
}

export function AuditLogPage() {
  const [subjectType, setSubjectType] = useState('')
  const [action, setAction] = useState('')
  const [page, setPage] = useState(1)

  const { data: subjectTypes } = useActivityLogSubjectTypes()
  const { data, isLoading } = useActivityLogs({
    subject_type: subjectType || undefined,
    action: action || undefined,
    page,
    per_page: 25,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Who changed what, across finance and grades.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Select
                value={subjectType || '__all'}
                onValueChange={(v) => {
                  setSubjectType(v === '__all' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All types</SelectItem>
                  {subjectTypes?.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={action || '__all'}
                onValueChange={(v) => {
                  setAction(v === '__all' ? '' : v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">When</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead className="w-24">Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nothing logged yet.
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{entry.user_name ?? 'System'}</TableCell>
                  <TableCell>{entry.subject_type}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[entry.action]}>{entry.action}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs text-sm">{entry.description}</TableCell>
                  <TableCell className="max-w-sm">
                    <ChangesSummary entry={entry} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {data && data.meta.last_page > 1 && (
            <div className="flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                Page {data.meta.current_page} of {data.meta.last_page} ({data.meta.total} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
