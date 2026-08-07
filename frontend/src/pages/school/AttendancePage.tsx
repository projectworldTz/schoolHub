import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { AlertTriangle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useAttendanceLog, useAttendanceRegister, useMarkAttendance } from '@/hooks/useAttendance'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses } from '@/hooks/useAcademics'
import { AttendanceStatusBadge } from '@/components/school/AttendanceStatusBadge'
import { TablePagination } from '@/components/school/TablePagination'
import type { AttendanceStatus } from '@/types/attendance'

type MarkedStatus = AttendanceStatus | ''

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
]

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
}

const STATUS_DOT_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-500',
  late: 'bg-amber-500',
  absent: 'bg-red-500',
  excused: 'bg-blue-500',
}

const STATUS_TRIGGER_STYLES: Record<AttendanceStatus, string> = {
  present: 'border-green-600/30 bg-green-500/15 text-green-800 dark:text-green-400',
  late: 'border-amber-600/30 bg-amber-500/15 text-amber-800 dark:text-amber-400',
  absent: 'border-red-600/30 bg-red-500/15 text-red-800 dark:text-red-400',
  excused: 'border-blue-600/30 bg-blue-500/15 text-blue-800 dark:text-blue-400',
}

const HISTORY_PER_PAGE = 100
const ALL_CLASSES = '__all'
const ALL_STATUSES = '__all'

function StatusDot({ status }: { status: AttendanceStatus }) {
  return <span className={cn('inline-block size-2 rounded-full', STATUS_DOT_STYLES[status])} />
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function RegisterTab() {
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const [academicYearId, setAcademicYearId] = useState('')
  const [schoolClassId, setSchoolClassId] = useState('')
  const [date, setDate] = useState(todayIsoDate())
  const [rows, setRows] = useState<Record<string, { status: MarkedStatus; remarks: string }>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (!academicYearId && academicYears?.length) {
      setAcademicYearId(academicYears.find((y) => y.is_current)?.id ?? academicYears[0].id)
    }
  }, [academicYears, academicYearId])

  const { data: register, isLoading } = useAttendanceRegister({
    school_class_id: schoolClassId,
    academic_year_id: academicYearId,
    date,
  })
  const rosterRows = register?.rows
  const isLocked = register?.confirmed ?? false

  useEffect(() => {
    if (!rosterRows) return
    const initial: Record<string, { status: MarkedStatus; remarks: string }> = {}
    for (const row of rosterRows) {
      initial[row.student_id] = { status: row.status ?? '', remarks: row.remarks ?? '' }
    }
    setRows(initial)
  }, [rosterRows])

  const mark = useMarkAttendance()

  const canSave = useMemo(
    () => Boolean(schoolClassId && academicYearId && date && rosterRows && rosterRows.length > 0 && !isLocked),
    [schoolClassId, academicYearId, date, rosterRows, isLocked]
  )

  const unmarkedCount = useMemo(
    () => (rosterRows ?? []).filter((row) => !rows[row.student_id]?.status).length,
    [rosterRows, rows]
  )

  const statusCounts = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, excused: 0 }
    for (const row of Object.values(rows)) {
      if (row.status) counts[row.status] += 1
    }
    return counts
  }, [rows])

  function handleOpenConfirm() {
    if (unmarkedCount > 0) {
      toast.error(
        unmarkedCount === 1
          ? '1 student still needs a status before you can save.'
          : `${unmarkedCount} students still need a status before you can save.`
      )
      return
    }
    setConfirmOpen(true)
  }

  function handleConfirm() {
    if (!rosterRows) return
    mark.mutate(
      {
        school_class_id: schoolClassId,
        academic_year_id: academicYearId,
        date,
        records: rosterRows.map((row) => ({
          student_id: row.student_id,
          status: rows[row.student_id]?.status as AttendanceStatus,
          remarks: rows[row.student_id]?.remarks || undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Attendance confirmed and locked')
          setConfirmOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not save attendance')
            : 'Something went wrong'
          toast.error(message)
          setConfirmOpen(false)
        },
      }
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={schoolClassId} onValueChange={setSchoolClassId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" className="w-48" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLocked && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Attendance for this class and date has been confirmed
                {register?.confirmed_by_name ? ` by ${register.confirmed_by_name}` : ''}
                {register?.confirmed_at ? ` on ${new Date(register.confirmed_at).toLocaleString()}` : ''} and can no
                longer be changed.
              </p>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!schoolClassId && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Choose a class and date to load the register.
                  </TableCell>
                </TableRow>
              )}
              {schoolClassId && isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {schoolClassId && !isLoading && rosterRows?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No students enrolled in this class for the selected year.
                  </TableCell>
                </TableRow>
              )}
              {rosterRows?.map((row) => (
                <TableRow key={row.student_id}>
                  <TableCell>{row.admission_number}</TableCell>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>
                    <Select
                      value={rows[row.student_id]?.status || undefined}
                      disabled={isLocked}
                      onValueChange={(value) =>
                        setRows((prev) => ({
                          ...prev,
                          [row.student_id]: { ...prev[row.student_id], status: value as AttendanceStatus, remarks: prev[row.student_id]?.remarks ?? '' },
                        }))
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          'w-36',
                          rows[row.student_id]?.status
                            ? STATUS_TRIGGER_STYLES[rows[row.student_id].status as AttendanceStatus]
                            : 'border-dashed text-muted-foreground'
                        )}
                      >
                        <SelectValue placeholder="Mark" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <StatusDot status={opt.value} />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rows[row.student_id]?.remarks ?? ''}
                      disabled={isLocked}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [row.student_id]: { status: prev[row.student_id]?.status ?? '', remarks: e.target.value },
                        }))
                      }
                      placeholder="Optional"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {canSave && (
            <div className="flex items-center justify-end gap-3">
              {unmarkedCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {unmarkedCount === 1 ? '1 student not yet marked' : `${unmarkedCount} students not yet marked`}
                </p>
              )}
              <Button onClick={handleOpenConfirm}>Save attendance</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                You are about to confirm attendance for <strong>{date}</strong>. Once confirmed, it is locked and
                cannot be changed — double-check every student's status before continuing.
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-3 text-sm">
              {STATUS_OPTIONS.map((opt) => (
                <div key={opt.value} className="contents">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <StatusDot status={opt.value} />
                    {STATUS_LABELS[opt.value]}
                  </dt>
                  <dd className="text-right font-semibold">{statusCounts[opt.value]}</dd>
                </div>
              ))}
            </dl>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={mark.isPending} onClick={() => setConfirmOpen(false)}>
              Back
            </Button>
            <Button type="button" disabled={mark.isPending} onClick={handleConfirm}>
              {mark.isPending ? 'Saving…' : 'Confirm & lock attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function HistoryTab() {
  const { data: classes } = useClasses.useList()
  const [schoolClassId, setSchoolClassId] = useState('')
  const [status, setStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAttendanceLog({
    school_class_id: schoolClassId || undefined,
    status: (status || undefined) as AttendanceStatus | undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    search: search || undefined,
    page,
    per_page: HISTORY_PER_PAGE,
  })

  function resetPage() {
    setPage(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>
          <div className="mt-2 flex flex-wrap gap-3">
            <Input
              placeholder="Search by student name or admission number…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPage()
              }}
              className="max-w-xs"
            />
            <Select
              value={schoolClassId || ALL_CLASSES}
              onValueChange={(v) => {
                setSchoolClassId(v === ALL_CLASSES ? '' : v)
                resetPage()
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CLASSES}>All classes</SelectItem>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={status || ALL_STATUSES}
              onValueChange={(v) => {
                setStatus(v === ALL_STATUSES ? '' : v)
                resetPage()
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <StatusDot status={opt.value} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                resetPage()
              }}
              placeholder="From"
            />
            <Input
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                resetPage()
              }}
              placeholder="To"
            />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Marked by</TableHead>
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
                  No attendance records match these filters.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.date}</TableCell>
                <TableCell className="font-medium">
                  {record.student_name}
                  {record.admission_number ? ` (${record.admission_number})` : ''}
                </TableCell>
                <TableCell>{record.school_class_name ?? '—'}</TableCell>
                <TableCell>
                  <AttendanceStatusBadge status={record.status} />
                </TableCell>
                <TableCell>{record.remarks ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{record.marked_by_name ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data && (
          <TablePagination
            page={data.meta.current_page}
            totalPages={data.meta.last_page}
            totalItems={data.meta.total}
            pageSize={data.meta.per_page}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground">Mark daily class attendance and review past records.</p>
      </div>

      <Tabs defaultValue="register">
        <TabsList>
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="register" className="mt-4 space-y-6">
          <RegisterTab />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
