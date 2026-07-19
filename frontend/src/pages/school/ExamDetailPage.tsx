import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import {
  useAddExamSubject,
  useClassRanking,
  useClassSummary,
  useDeleteExamSubject,
  useExam,
  useTeacherPerformance,
  useUpdateExamStatus,
} from '@/hooks/useExams'
import { useClasses, useSubjects } from '@/hooks/useAcademics'
import { useSchoolProfile } from '@/hooks/useSchoolSetup'
import { bulkReportCardPdfUrl, reportCardPdfUrl } from '@/api/exams'
import type { Exam, ExamStatus } from '@/types/exams'

const examSubjectSchema = z.object({
  school_class_id: z.string().min(1, 'Required'),
  subject_id: z.string().min(1, 'Required'),
  max_marks: z.string().min(1, 'Required'),
  pass_marks: z.string().optional(),
  exam_date: z.string().optional(),
})

function AddSubjectDialog({ examId }: { examId: string }) {
  const [open, setOpen] = useState(false)
  const { data: classes } = useClasses.useList()
  const { data: subjects } = useSubjects.useList()
  const addSubject = useAddExamSubject(examId)
  const form = useForm({
    resolver: zodResolver(examSubjectSchema),
    defaultValues: { school_class_id: '', subject_id: '', max_marks: '100', pass_marks: '', exam_date: '' },
  })

  function onSubmit(values: z.infer<typeof examSubjectSchema>) {
    addSubject.mutate(
      {
        school_class_id: values.school_class_id,
        subject_id: values.subject_id,
        max_marks: Number(values.max_marks),
        pass_marks: values.pass_marks ? Number(values.pass_marks) : undefined,
        exam_date: values.exam_date || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Subject added to exam')
          form.reset()
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not add subject')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add subject</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add class + subject to exam</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                name="subject_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subjects?.map((s) => (
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max marks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pass_marks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pass marks (optional)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="exam_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exam date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={addSubject.isPending}>
                {addSubject.isPending ? 'Saving…' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function ReportCardsCard({ exam }: { exam: Exam }) {
  const classes = Array.from(
    new Map((exam.subjects ?? []).map((s) => [s.school_class_id, s.school_class_name ?? 'Class'])).entries()
  ).map(([id, name]) => ({ id, name }))

  const [classId, setClassId] = useState(classes[0]?.id ?? '')
  const [generateAll, setGenerateAll] = useState(true)
  const [studentId, setStudentId] = useState('')

  const { data: ranking, isLoading } = useClassRanking(exam.id, classId)
  const { data: summary } = useClassSummary(exam.id, classId)

  function handleGenerate() {
    if (generateAll) {
      window.open(bulkReportCardPdfUrl(exam.id, classId), '_blank')
    } else if (studentId) {
      window.open(reportCardPdfUrl(studentId, exam.id), '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report cards</CardTitle>
        <CardDescription>
          Ranked by average percentage across graded subjects. Generate one student's report card, or every graded
          student's at once.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm sm:grid-cols-4">
            <p>
              <span className="text-muted-foreground">Class average:</span>{' '}
              {summary.class_average !== null ? `${summary.class_average}%` : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Pass rate:</span>{' '}
              {summary.pass_rate !== null ? `${summary.pass_rate}%` : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Strongest:</span>{' '}
              {summary.strongest_subject ? `${summary.strongest_subject.name} (${summary.strongest_subject.average_percentage}%)` : '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Weakest:</span>{' '}
              {summary.weakest_subject ? `${summary.weakest_subject.name} (${summary.weakest_subject.average_percentage}%)` : '—'}
            </p>
            {summary.performance_message && (
              <p className="col-span-2 sm:col-span-4">
                {summary.performance_message.emoji} {summary.performance_message.message}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 pb-2 text-sm font-medium">
            <Checkbox checked={generateAll} onCheckedChange={(checked) => setGenerateAll(Boolean(checked))} />
            Generate all
          </label>

          {!generateAll && (
            <div className="space-y-1">
              <label className="text-sm font-medium">Student</label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {ranking?.map((row) => (
                    <SelectItem key={row.student_id} value={row.student_id}>
                      {row.position}. {row.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={!classId || (!generateAll && !studentId)}>
            Generate PDF{generateAll ? ' (all)' : ''}
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Admission #</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!classId && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Add a subject to this exam first.
                </TableCell>
              </TableRow>
            )}
            {classId && isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {classId && !isLoading && ranking?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No graded students yet.
                </TableCell>
              </TableRow>
            )}
            {ranking?.map((row) => (
              <TableRow key={row.student_id}>
                <TableCell className="font-semibold text-primary">{row.position}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.admission_number}</TableCell>
                <TableCell>{row.average_percentage}%</TableCell>
                <TableCell>{row.grade ? <Badge>{row.grade}</Badge> : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function TeacherPerformanceCard({ examId }: { examId: string }) {
  const { data: teachers, isLoading } = useTeacherPerformance(examId)

  if (!isLoading && (teachers?.length ?? 0) === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher performance</CardTitle>
        <CardDescription>
          Teachers ranked by their students' average score, inferred from the timetable for each class/subject.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Students graded</TableHead>
              <TableHead>Subjects</TableHead>
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
            {teachers?.map((row) => (
              <TableRow key={row.teacher_id}>
                <TableCell className="font-semibold text-primary">{row.position}</TableCell>
                <TableCell className="font-medium">{row.teacher_name}</TableCell>
                <TableCell>{row.average_percentage}%</TableCell>
                <TableCell>{row.students_graded}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.subjects.map((s) => `${s.subject_name} (${s.class_name})`).join(', ')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

const EXAM_STATUS_OPTIONS: { value: ExamStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'published', label: 'Published' },
]

function ExamStatusControl({ exam }: { exam: Exam }) {
  const updateStatus = useUpdateExamStatus(exam.id)
  const { data: school } = useSchoolProfile()
  const noticeBoardUrl = school?.slug ? `${window.location.origin}/notice-board/${school.slug}` : null

  function handleChange(status: ExamStatus) {
    updateStatus.mutate(status, {
      onSuccess: () =>
        toast.success(
          status === 'published'
            ? 'Published — visible on the public Notice Board and Parent Portal now.'
            : 'Exam status updated.'
        ),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not update status')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Select value={exam.status} onValueChange={(v) => handleChange(v as ExamStatus)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EXAM_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {exam.status === 'published' && noticeBoardUrl && (
        <a href={noticeBoardUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
          View on Notice Board ↗
        </a>
      )}
    </div>
  )
}

export function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const examId = id ?? ''
  const { data: exam, isLoading } = useExam(examId)
  const removeSubject = useDeleteExamSubject(examId)

  if (isLoading || !exam) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={exam.name} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{exam.name}</h1>
          <p className="text-sm text-muted-foreground">
            {exam.exam_type} · {exam.academic_year_name} · {exam.start_date ?? '—'} – {exam.end_date ?? '—'}
          </p>
        </div>
        <ExamStatusControl exam={exam} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Class + subject combinations examined, with their gradebooks.</CardDescription>
          </div>
          <AddSubjectDialog examId={examId} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Max marks</TableHead>
                <TableHead>Pass marks</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {exam.subjects?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No subjects added yet.
                  </TableCell>
                </TableRow>
              )}
              {exam.subjects?.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>{subject.school_class_name}</TableCell>
                  <TableCell>
                    <Link to={`/app/exam-subjects/${subject.id}`} className="font-medium hover:underline">
                      {subject.subject_name}
                    </Link>
                  </TableCell>
                  <TableCell>{subject.max_marks}</TableCell>
                  <TableCell>{subject.pass_marks ?? '—'}</TableCell>
                  <TableCell>{subject.exam_date ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeSubject.mutate(subject.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(exam.subjects?.length ?? 0) > 0 && <ReportCardsCard exam={exam} />}
      {(exam.subjects?.length ?? 0) > 0 && <TeacherPerformanceCard examId={exam.id} />}
    </div>
  )
}
