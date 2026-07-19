import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Trash2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiOrigin } from '@/api/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAttachGuardian,
  useDeleteDocument,
  useDetachGuardian,
  useEnrollments,
  useEnrollStudent,
  useGrantGuardianPortalAccess,
  useStudent,
  useStudentDocuments,
  useUploadStudentDocument,
} from '@/hooks/useStudents'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses, useStreams } from '@/hooks/useAcademics'
import { useExams, useReportCard, useSetReportCardRemark } from '@/hooks/useExams'
import { reportCardPdfUrl } from '@/api/exams'
import { Textarea } from '@/components/ui/textarea'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'

const guardianSchema = z.object({
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  relationship: z.string().min(1, 'Required'),
  is_primary: z.boolean().default(false),
  is_emergency_contact: z.boolean().default(false),
})

function AddGuardianDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const attach = useAttachGuardian(studentId)
  const form = useForm({
    resolver: zodResolver(guardianSchema),
    defaultValues: { name: '', phone: '', email: '', relationship: '', is_primary: false, is_emergency_contact: false },
  })

  function onSubmit(values: z.infer<typeof guardianSchema>) {
    attach.mutate(values, {
      onSuccess: () => {
        toast.success('Guardian added')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not add guardian')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add guardian</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add guardian</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <FormControl>
                    <Input placeholder="father, mother, guardian…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={attach.isPending}>
                {attach.isPending ? 'Saving…' : 'Add guardian'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const enrollSchema = z.object({
  academic_year_id: z.string().min(1, 'Required'),
  school_class_id: z.string().min(1, 'Required'),
  stream_id: z.string().optional(),
  enrolled_at: z.string().min(1, 'Required'),
})

function EnrollDialog({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false)
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const { data: streams } = useStreams.useList()
  const enroll = useEnrollStudent(studentId)
  const form = useForm({
    resolver: zodResolver(enrollSchema),
    defaultValues: { academic_year_id: '', school_class_id: '', stream_id: '', enrolled_at: '' },
  })

  function onSubmit(values: z.infer<typeof enrollSchema>) {
    enroll.mutate(values, {
      onSuccess: () => {
        toast.success('Student enrolled')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not enroll student')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Enroll</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll student</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic year</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYears?.map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="school_class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stream_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {streams?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enrolled_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enrolled on</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={enroll.isPending}>
                {enroll.isPending ? 'Saving…' : 'Enroll'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function DocumentsCard({ studentId }: { studentId: string }) {
  const { data: documents, isLoading } = useStudentDocuments(studentId)
  const upload = useUploadStudentDocument(studentId)
  const remove = useDeleteDocument(studentId)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    upload.mutate(file, {
      onSuccess: () => toast.success('Document uploaded'),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not upload document')
          : 'Something went wrong'
        toast.error(message)
      },
    })
    e.target.value = ''
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <Button size="sm" variant="outline" asChild>
          <label className="cursor-pointer">
            <Upload className="size-4" /> Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && documents?.length === 0 && (
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        )}
        {documents?.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>{doc.name}</span>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(doc.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function GrantPortalAccessDialog({
  studentId,
  guardianId,
  guardianEmail,
}: {
  studentId: string
  guardianId: string
  guardianEmail: string | null
}) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(guardianEmail ?? '')
  const [result, setResult] = useState<{ email: string; temporary_password: string } | null>(null)
  const grant = useGrantGuardianPortalAccess(studentId)

  function handleSubmit() {
    grant.mutate(
      { guardianId, email },
      {
        onSuccess: (data) => {
          setResult(data)
          toast.success('Portal access granted')
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not grant portal access')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setResult(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Grant access
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant parent portal access</DialogTitle>
        </DialogHeader>
        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Share these credentials with the parent directly — there's no email/SMS delivery yet, so this is
              shown once.
            </p>
            <div className="space-y-2 rounded-lg border p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Email:</span> {result.email}
              </p>
              <p>
                <span className="text-muted-foreground">Temporary password:</span>{' '}
                <span className="font-mono">{result.temporary_password}</span>
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Guardian email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@example.com" />
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={grant.isPending || !email}>
                {grant.isPending ? 'Granting…' : 'Grant access'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ClassTeacherRemarkEditor({
  examId,
  studentId,
  initialRemark,
}: {
  examId: string
  studentId: string
  initialRemark: string | null | undefined
}) {
  const [remark, setRemark] = useState(initialRemark ?? '')
  const save = useSetReportCardRemark(examId, studentId)

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <p className="text-sm font-medium">Class teacher's remark</p>
      <Textarea
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        placeholder="e.g. Good effort this term, needs to work on Chemistry."
        rows={2}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={save.isPending}
          onClick={() => save.mutate(remark, { onSuccess: () => toast.success('Remark saved') })}
        >
          {save.isPending ? 'Saving…' : 'Save remark'}
        </Button>
      </div>
    </div>
  )
}

function ReportCardsCard({ studentId }: { studentId: string }) {
  const { data: academicYears } = useAcademicYears.useList()
  const [academicYearId, setAcademicYearId] = useState('')
  const [examId, setExamId] = useState('')
  const { data: exams } = useExams(academicYearId)
  const { data: reportCard, isLoading } = useReportCard(studentId, examId)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Report card</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Select value={academicYearId} onValueChange={(v) => { setAcademicYearId(v); setExamId('') }}>
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
              <Select value={examId} onValueChange={setExamId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </div>
        {examId && reportCard && (
          <Button size="sm" variant="outline" onClick={() => window.open(reportCardPdfUrl(studentId, examId), '_blank')}>
            Download PDF
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!examId && <p className="text-sm text-muted-foreground">Choose an academic year and exam.</p>}
        {examId && isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {examId && !isLoading && reportCard && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Subject rank</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportCard.subjects.map((s) => (
                  <TableRow key={s.subject_name}>
                    <TableCell>{s.subject_name}</TableCell>
                    <TableCell>
                      {s.marks_obtained ?? '—'} / {s.max_marks}
                    </TableCell>
                    <TableCell>{s.grade ? <Badge>{s.grade}</Badge> : '—'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.subject_position ? `${s.subject_position} / ${s.subject_size}` : '—'}
                    </TableCell>
                    <TableCell>{s.remarks ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-wrap items-center gap-6 rounded-lg border p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Total:</span> {reportCard.summary.total_obtained} /{' '}
                {reportCard.summary.total_max}
              </p>
              <p>
                <span className="text-muted-foreground">Average:</span> {reportCard.summary.average_percentage ?? '—'}%
              </p>
              <p>
                <span className="text-muted-foreground">Overall grade:</span>{' '}
                {reportCard.summary.overall_grade ? <Badge>{reportCard.summary.overall_grade}</Badge> : '—'}
              </p>
              <p>
                <span className="text-muted-foreground">Class position:</span>{' '}
                {reportCard.summary.class_position
                  ? `${reportCard.summary.class_position} of ${reportCard.summary.class_size}`
                  : '—'}
              </p>
            </div>

            {reportCard.summary.performance_message && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <p className="font-medium">
                  {reportCard.summary.performance_message.emoji} {reportCard.summary.performance_message.title}
                </p>
                <p className="mt-1 text-muted-foreground">{reportCard.summary.performance_message.message}</p>
              </div>
            )}

            <ClassTeacherRemarkEditor
              examId={examId}
              studentId={studentId}
              initialRemark={reportCard.summary.class_teacher_remark}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StudentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const studentId = id ?? ''
  const { data: student, isLoading } = useStudent(studentId)
  const { data: enrollments } = useEnrollments(studentId)
  const detachGuardian = useDetachGuardian(studentId)

  if (isLoading || !student) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={student.full_name} />
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{student.full_name}</h1>
            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>{student.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Admission #{student.admission_number}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              Documents
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                window.open(`${apiOrigin}/api/school/students/${studentId}/certificate?type=enrollment`, '_blank')
              }
            >
              Certificate of enrollment
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                window.open(`${apiOrigin}/api/school/students/${studentId}/certificate?type=completion`, '_blank')
              }
            >
              Certificate of completion
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => window.open(`${apiOrigin}/api/school/students/${studentId}/transcript`, '_blank')}
            >
              Academic transcript
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Date of birth</p>
            <p>{student.date_of_birth?.slice(0, 10) ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gender</p>
            <p>{student.gender ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Blood group</p>
            <p>{student.blood_group ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Emergency contact</p>
            <p>{student.emergency_contact_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">QR code</p>
            <p className="font-mono text-xs">{student.qr_code}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardDescription>
            <CardTitle>Guardians</CardTitle>
          </CardDescription>
          <AddGuardianDialog studentId={studentId} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Portal access</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.guardians?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No guardians linked.
                  </TableCell>
                </TableRow>
              )}
              {student.guardians?.map((guardian) => (
                <TableRow key={guardian.id}>
                  <TableCell>{guardian.name}</TableCell>
                  <TableCell className="capitalize">{guardian.relationship}</TableCell>
                  <TableCell>{guardian.phone ?? '—'}</TableCell>
                  <TableCell>
                    {guardian.has_portal_access ? (
                      <Badge variant="outline">Enabled</Badge>
                    ) : (
                      <GrantPortalAccessDialog
                        studentId={studentId}
                        guardianId={guardian.id}
                        guardianEmail={guardian.email}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => detachGuardian.mutate(guardian.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Enrollment history</CardTitle>
          <EnrollDialog studentId={studentId} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Academic year</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Stream</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No enrollment history.
                  </TableCell>
                </TableRow>
              )}
              {enrollments?.map((enr) => (
                <TableRow key={enr.id}>
                  <TableCell>{enr.academic_year_name}</TableCell>
                  <TableCell>{enr.school_class_name}</TableCell>
                  <TableCell>{enr.stream_name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={enr.status === 'active' ? 'default' : 'secondary'}>{enr.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DocumentsCard studentId={studentId} />
      <ReportCardsCard studentId={studentId} />
    </div>
  )
}
