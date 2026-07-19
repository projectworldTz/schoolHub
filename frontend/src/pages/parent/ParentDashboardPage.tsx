import { useState, useEffect } from 'react'
import {
  CalendarCheck,
  GraduationCap,
  Megaphone,
  NotebookPen,
  Receipt,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useChildAttendance,
  useChildFees,
  useChildHomework,
  useChildResults,
  useMyChildren,
  useParentAnnouncements,
} from '@/hooks/useParentPortal'
import type { Student } from '@/types/students'
import type { InvoiceStatus } from '@/types/finance'

const INVOICE_STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  unpaid: 'secondary',
  partial: 'outline',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'secondary',
}

const ATTENDANCE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  present: 'default',
  absent: 'destructive',
  late: 'secondary',
  excused: 'outline',
}

function ChildOverview({ student }: { student: Student }) {
  const { data: attendance, isLoading: attendanceLoading } = useChildAttendance(student.id)
  const { data: homework, isLoading: homeworkLoading } = useChildHomework(student.id)
  const { data: results, isLoading: resultsLoading } = useChildResults(student.id)
  const { data: invoices, isLoading: invoicesLoading } = useChildFees(student.id)

  const outstandingBalance = (invoices ?? []).reduce((sum, inv) => sum + Number(inv.balance), 0)

  const presentCount = attendance?.filter((a) => a.status === 'present').length ?? 0
  const totalMarked = attendance?.length ?? 0

  // Backend already orders exams newest-first by exam start_date.
  const latestResult = results?.[0]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{student.full_name}</CardTitle>
          <CardDescription>
            Admission #{student.admission_number}
            {student.current_enrollment && ` · ${student.current_enrollment.school_class_name}`}
          </CardDescription>
        </CardHeader>
      </Card>

      {latestResult?.performance_message && (
        <Card className="border-none bg-gradient-brand text-white shadow-md shadow-primary/20">
          <CardContent className="p-5">
            <p className="text-sm text-white/80">Latest: {latestResult.exam_name}</p>
            <p className="mt-1 text-lg font-semibold">
              {latestResult.performance_message.emoji} {latestResult.performance_message.title}
            </p>
            <p className="mt-1 text-sm text-white/90">{latestResult.performance_message.message}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <CalendarCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Attendance (last 60 days)</p>
              <p className="font-display text-2xl font-semibold">
                {attendanceLoading ? '…' : `${presentCount}/${totalMarked}`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <NotebookPen className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Homework</p>
              <p className="font-display text-2xl font-semibold">{homeworkLoading ? '…' : homework?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Exams recorded</p>
              <p className="font-display text-2xl font-semibold">{resultsLoading ? '…' : results?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <span className="bg-gradient-brand flex size-10 items-center justify-center rounded-xl text-white">
              <Receipt className="size-5" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Fees outstanding</p>
              <p className="font-display text-2xl font-semibold">
                {invoicesLoading ? '…' : outstandingBalance.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fees</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!invoicesLoading && invoices?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No invoices yet.
                  </TableCell>
                </TableRow>
              )}
              {invoices?.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{Number(inv.total_amount).toLocaleString()}</TableCell>
                  <TableCell>{Number(inv.amount_paid).toLocaleString()}</TableCell>
                  <TableCell>{Number(inv.balance).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={INVOICE_STATUS_VARIANT[inv.status]}>{inv.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!attendanceLoading && attendance?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No attendance recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {attendance?.slice(0, 10).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.date}</TableCell>
                  <TableCell>
                    <Badge variant={ATTENDANCE_VARIANT[a.status]}>{a.status}</Badge>
                  </TableCell>
                  <TableCell>{a.remarks ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!homeworkLoading && homework?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No homework yet.
                  </TableCell>
                </TableRow>
              )}
              {homework?.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.homework_title}</TableCell>
                  <TableCell>{h.subject_name ?? '—'}</TableCell>
                  <TableCell>{h.due_date ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{h.status}</Badge>
                  </TableCell>
                  <TableCell>{h.grade ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!resultsLoading && results?.length === 0 && (
            <p className="text-sm text-muted-foreground">No exam results yet.</p>
          )}
          {results?.map((group) => (
            <div key={group.exam_id} className="rounded-lg border p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{group.exam_name}</p>
                <div className="flex items-center gap-2 text-sm">
                  {group.overall_grade && <Badge>{group.overall_grade}</Badge>}
                  <span className="text-muted-foreground">
                    {group.average_percentage !== null ? `${group.average_percentage}%` : '—'}
                    {group.class_position ? ` · ranked ${group.class_position} of ${group.class_size}` : ''}
                  </span>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.subjects.map((s) => (
                    <TableRow key={s.subject_name}>
                      <TableCell>{s.subject_name}</TableCell>
                      <TableCell>
                        {s.marks_obtained ?? '—'} / {s.max_marks}
                      </TableCell>
                      <TableCell>{s.grade ? <Badge>{s.grade}</Badge> : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function ParentDashboardPage() {
  const { data: children, isLoading } = useMyChildren()
  const { data: announcements } = useParentAnnouncements()
  const [activeChild, setActiveChild] = useState('')

  useEffect(() => {
    if (!activeChild && children?.length) setActiveChild(children[0].id)
  }, [children, activeChild])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Parent Portal</h1>
        <p className="text-sm text-muted-foreground">Your children's attendance, homework, and results.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && children?.length === 0 && (
        <p className="text-sm text-muted-foreground">No children are linked to your account yet.</p>
      )}

      {children && children.length > 0 && (
        <Tabs value={activeChild} onValueChange={setActiveChild}>
          <TabsList>
            {children.map((child) => (
              <TabsTrigger key={child.id} value={child.id}>
                {child.full_name}
              </TabsTrigger>
            ))}
          </TabsList>
          {children.map((child) => (
            <TabsContent key={child.id} value={child.id} className="mt-4">
              <ChildOverview student={child} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Megaphone className="size-4" /> Announcements
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {announcements?.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
          {announcements?.map((a) => (
            <div key={a.id} className="rounded-lg border p-3">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
