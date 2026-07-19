import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useCourse, useCreateLesson, useDeleteLesson } from '@/hooks/useLms'

const lessonSchema = z.object({
  title: z.string().min(1, 'Required'),
  content: z.string().optional(),
  sort_order: z.string().optional(),
})

function AddLessonDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const create = useCreateLesson(courseId)
  const form = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '', content: '', sort_order: '' },
  })

  function onSubmit(values: z.infer<typeof lessonSchema>) {
    create.mutate(
      { title: values.title, content: values.content, sort_order: values.sort_order ? Number(values.sort_order) : undefined },
      {
        onSuccess: () => {
          toast.success('Lesson added')
          form.reset()
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not add lesson')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add lesson</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add lesson</DialogTitle>
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
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea rows={6} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const courseId = id ?? ''
  const { data: course, isLoading } = useCourse(courseId)
  const removeLesson = useDeleteLesson(courseId)

  if (isLoading || !course) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={course.title} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{course.title}</h1>
        <Badge variant={course.is_published ? 'default' : 'secondary'}>
          {course.is_published ? 'Published' : 'Draft'}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {course.subject_name} {course.school_class_name ? `· ${course.school_class_name}` : ''} · {course.teacher_name}
      </p>
      {course.description && <p className="text-sm">{course.description}</p>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lessons</CardTitle>
            <CardDescription>Content delivered in this course, in order.</CardDescription>
          </div>
          <AddLessonDialog courseId={courseId} />
        </CardHeader>
        <CardContent className="space-y-2">
          {course.lessons?.length === 0 && (
            <p className="text-sm text-muted-foreground">No lessons added yet.</p>
          )}
          {course.lessons?.map((lesson) => (
            <div key={lesson.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">{lesson.title}</p>
                {lesson.content && <p className="mt-1 text-sm text-muted-foreground">{lesson.content}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeLesson.mutate(lesson.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
