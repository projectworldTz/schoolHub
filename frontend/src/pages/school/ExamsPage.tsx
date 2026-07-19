import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { useCreateExam, useDeleteExam, useExams } from '@/hooks/useExams'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import type { ExamStatus, ExamType } from '@/types/exams'

const STATUS_VARIANT: Record<ExamStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  scheduled: 'outline',
  completed: 'default',
  published: 'default',
}

const examSchema = z.object({
  academic_year_id: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  exam_type: z.enum(['quiz', 'midterm', 'final', 'mock', 'other']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

function CreateExamDialog() {
  const [open, setOpen] = useQuickAddTrigger('exam')
  const { data: academicYears } = useAcademicYears.useList()
  const create = useCreateExam()
  const form = useForm({
    resolver: zodResolver(examSchema),
    defaultValues: {
      academic_year_id: '',
      name: '',
      exam_type: 'final' as ExamType,
      start_date: '',
      end_date: '',
    },
  })

  function onSubmit(values: z.infer<typeof examSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Exam created')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not create exam')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New exam</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create exam</DialogTitle>
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
                    <Input placeholder="End of Term 2 Exams" {...field} />
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
                name="exam_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="midterm">Midterm</SelectItem>
                        <SelectItem value="final">Final</SelectItem>
                        <SelectItem value="mock">Mock</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function ExamsPage() {
  const { data: exams, isLoading } = useExams()
  const remove = useDeleteExam()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Examinations</h1>
          <p className="text-sm text-muted-foreground">Exams, subject marks, and report cards.</p>
        </div>
        <CreateExamDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
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
              {!isLoading && exams?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No exams created yet.
                  </TableCell>
                </TableRow>
              )}
              {exams?.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">
                    <Link to={`/app/exams/${exam.id}`} className="hover:underline">
                      {exam.name}
                    </Link>
                  </TableCell>
                  <TableCell className="capitalize">{exam.exam_type}</TableCell>
                  <TableCell>{exam.academic_year_name}</TableCell>
                  <TableCell>
                    {exam.start_date ?? '—'} – {exam.end_date ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[exam.status]}>{exam.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(exam.id)}>
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
