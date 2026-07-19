import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHomeworks, useHomework, useCreateHomework, useDeleteHomework, useGradeSubmission } from '@/hooks/useHomework'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses, useSubjects } from '@/hooks/useAcademics'
import { useStaffList } from '@/hooks/useStaff'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import type { HomeworkSubmissionStatus } from '@/types/homework'

const homeworkSchema = z.object({
  school_class_id: z.string().min(1, 'Required'),
  subject_id: z.string().min(1, 'Required'),
  teacher_id: z.string().min(1, 'Required'),
  academic_year_id: z.string().min(1, 'Required'),
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'Required'),
})

function CreateHomeworkDialog() {
  const [open, setOpen] = useState(false)
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const { data: subjects } = useSubjects.useList()
  const { data: staff } = useStaffList()
  const create = useCreateHomework()
  const form = useForm({
    resolver: zodResolver(homeworkSchema),
    defaultValues: {
      school_class_id: '',
      subject_id: '',
      teacher_id: '',
      academic_year_id: '',
      title: '',
      description: '',
      due_date: '',
    },
  })

  function onSubmit(values: z.infer<typeof homeworkSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Homework assigned')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not assign homework')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New homework</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign homework</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <FormField
                control={form.control}
                name="teacher_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff?.data.map((s) => (
                          <SelectItem key={s.user_id} value={s.user_id}>
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
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Assign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function HomeworkListPage() {
  const { data: homeworks, isLoading } = useHomeworks()
  const remove = useDeleteHomework()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Homework</h1>
          <p className="text-sm text-muted-foreground">Assignments and submission tracking.</p>
        </div>
        <CreateHomeworkDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Submissions</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && homeworks?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No homework assigned yet.
                  </TableCell>
                </TableRow>
              )}
              {homeworks?.map((hw) => (
                <TableRow key={hw.id}>
                  <TableCell className="font-medium">
                    <Link to={`/app/homework/${hw.id}`} className="hover:underline">
                      {hw.title}
                    </Link>
                  </TableCell>
                  <TableCell>{hw.school_class_name}</TableCell>
                  <TableCell>{hw.subject_name}</TableCell>
                  <TableCell>{hw.teacher_name}</TableCell>
                  <TableCell>{hw.due_date}</TableCell>
                  <TableCell>{hw.submissions_count}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(hw.id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

const STATUS_VARIANT: Record<HomeworkSubmissionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  submitted: 'outline',
  graded: 'default',
  late: 'destructive',
}

function GradeDialog({ submissionId, homeworkId, onDone }: { submissionId: string; homeworkId: string; onDone: () => void }) {
  const grade = useGradeSubmission(homeworkId)
  const [status, setStatus] = useState<HomeworkSubmissionStatus>('graded')
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')

  function handleSave() {
    grade.mutate(
      { id: submissionId, payload: { status, grade: score ? Number(score) : undefined, feedback: feedback || undefined } },
      {
        onSuccess: () => {
          toast.success('Submission updated')
          onDone()
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update submission')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Grade submission</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(v) => setStatus(v as HomeworkSubmissionStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Grade (0-100)</label>
          <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Feedback</label>
          <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSave} disabled={grade.isPending}>
          {grade.isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function HomeworkDetailPage() {
  const { id } = useParams<{ id: string }>()
  const homeworkId = id ?? ''
  const { data: homework, isLoading } = useHomework(homeworkId)
  const [gradingId, setGradingId] = useState<string | null>(null)

  if (isLoading || !homework) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={homework.title} />
      <div>
        <h1 className="text-2xl font-semibold">{homework.title}</h1>
        <p className="text-sm text-muted-foreground">
          {homework.school_class_name} · {homework.subject_name} · Due {homework.due_date}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{homework.description || 'No description.'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>{homework.submissions?.length ?? 0} students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {homework.submissions?.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.student_name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[sub.status]}>{sub.status}</Badge>
                  </TableCell>
                  <TableCell>{sub.grade ?? '—'}</TableCell>
                  <TableCell>{sub.feedback ?? '—'}</TableCell>
                  <TableCell>
                    <Dialog open={gradingId === sub.id} onOpenChange={(open) => setGradingId(open ? sub.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Grade
                        </Button>
                      </DialogTrigger>
                      {gradingId === sub.id && (
                        <GradeDialog submissionId={sub.id} homeworkId={homeworkId} onDone={() => setGradingId(null)} />
                      )}
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
