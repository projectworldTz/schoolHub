import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useClasses } from '@/hooks/useAcademics'
import { useEligibleStudents, useGraduateBatch, useStatusChangeHistory } from '@/hooks/useGraduation'
import type { StudentTargetStatus } from '@/types/graduation'

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS: { value: StudentTargetStatus; label: string }[] = [
  { value: 'graduated', label: 'Graduated' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'withdrawn', label: 'Withdrawn' },
]

export function GraduationPage() {
  const [classId, setClassId] = useState<string>('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [toStatus, setToStatus] = useState<StudentTargetStatus>('graduated')
  const [effectiveDate, setEffectiveDate] = useState(todayIsoDate())
  const [reason, setReason] = useState('')

  const { data: classes } = useClasses.useList()
  const { data: eligible, isLoading } = useEligibleStudents({ school_class_id: classId || undefined })
  const { data: history, isLoading: historyLoading } = useStatusChangeHistory()
  const batch = useGraduateBatch()

  const selectedIds = Object.keys(selected).filter((id) => selected[id])
  const allSelected = Boolean(eligible?.length) && eligible!.every((s) => selected[s.student_id])

  function toggleAll() {
    if (!eligible) return
    if (allSelected) {
      setSelected({})
    } else {
      setSelected(Object.fromEntries(eligible.map((s) => [s.student_id, true])))
    }
  }

  function handleSubmit() {
    if (selectedIds.length === 0) return
    batch.mutate(
      { student_ids: selectedIds, to_status: toStatus, effective_date: effectiveDate, reason: reason || undefined },
      {
        onSuccess: (res) => {
          toast.success(res.message)
          setSelected({})
          setReason('')
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update status')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Graduation</h1>
        <p className="text-sm text-muted-foreground">Batch graduate a class, or record transfers and withdrawals.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch status change</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Select value={classId || '__all'} onValueChange={(v) => setClassId(v === '__all' ? '' : v)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All classes</SelectItem>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Stream</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && eligible?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No active students found.
                  </TableCell>
                </TableRow>
              )}
              {eligible?.map((student) => (
                <TableRow key={student.student_id}>
                  <TableCell>
                    <Checkbox
                      checked={Boolean(selected[student.student_id])}
                      onCheckedChange={(checked) =>
                        setSelected((prev) => ({ ...prev, [student.student_id]: Boolean(checked) }))
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.admission_number}</TableCell>
                  <TableCell>{student.class_name ?? '—'}</TableCell>
                  <TableCell>{student.stream_name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-end gap-3 border-t pt-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">New status</label>
              <Select value={toStatus} onValueChange={(v) => setToStatus(v as StudentTargetStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Effective date</label>
              <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className="w-44" />
            </div>
            <div className="min-w-64 flex-1 space-y-1">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. End of Form 4, 2026" rows={1} />
            </div>
            <Button onClick={handleSubmit} disabled={selectedIds.length === 0 || batch.isPending}>
              {batch.isPending ? 'Updating…' : `Update ${selectedIds.length || ''} student(s)`.trim()}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leaver & transfer records</CardTitle>
          <CardDescription>Every status change, most recent first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Effective date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Changed by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!historyLoading && history?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No status changes recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {history?.map((change) => (
                <TableRow key={change.id}>
                  <TableCell className="font-medium">{change.student_name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{change.from_status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{change.to_status}</Badge>
                  </TableCell>
                  <TableCell>{change.effective_date}</TableCell>
                  <TableCell className="max-w-64 truncate">{change.reason ?? '—'}</TableCell>
                  <TableCell>{change.changed_by_name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
