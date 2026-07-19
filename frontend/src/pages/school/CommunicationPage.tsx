import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAnnouncements } from '@/hooks/useCommunication'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useClasses } from '@/hooks/useAcademics'
import type { AnnouncementAudience } from '@/types/communication'

const SCHOOL_ROLES = [
  'School Owner', 'Principal', 'Vice Principal', 'Academic Master', 'Registrar', 'Admissions Officer',
  'Accountant', 'Bursar', 'HR Officer', 'Teacher', 'Class Teacher', 'Student', 'Parent', 'Librarian',
]

const announcementSchema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
  audience: z.enum(['school', 'class', 'role']),
  school_class_id: z.string().optional(),
  role: z.string().optional(),
})

function CreateAnnouncementDialog() {
  const [open, setOpen] = useQuickAddTrigger('announcement')
  const { data: classes } = useClasses.useList()
  const create = useAnnouncements.useCreate()
  const form = useForm({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', body: '', audience: 'school' as AnnouncementAudience, school_class_id: '', role: '' },
  })
  const audience = form.watch('audience')

  function onSubmit(values: z.infer<typeof announcementSchema>) {
    create.mutate(
      {
        title: values.title,
        body: values.body,
        audience: values.audience,
        school_class_id: values.audience === 'class' ? values.school_class_id : undefined,
        role: values.audience === 'role' ? values.role : undefined,
      },
      {
        onSuccess: () => {
          toast.success('Announcement posted')
          form.reset()
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not post announcement')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New announcement</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post announcement</DialogTitle>
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
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="school">Whole school</SelectItem>
                      <SelectItem value="class">A specific class</SelectItem>
                      <SelectItem value="role">A specific role</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {audience === 'class' && (
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
            )}
            {audience === 'role' && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCHOOL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Posting…' : 'Post'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  school: 'Whole school',
  class: 'Class',
  role: 'Role',
}

export function CommunicationPage() {
  const { data: announcements, isLoading } = useAnnouncements.useList()
  const remove = useAnnouncements.useRemove()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Communication</h1>
          <p className="text-sm text-muted-foreground">School announcements.</p>
        </div>
        <CreateAnnouncementDialog />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && announcements?.length === 0 && (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      )}
      <div className="space-y-3">
        {announcements?.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-base">{a.title}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {AUDIENCE_LABEL[a.audience]}
                    {a.audience === 'class' && a.school_class_name ? `: ${a.school_class_name}` : ''}
                    {a.audience === 'role' && a.role ? `: ${a.role}` : ''}
                  </Badge>
                  {a.created_by_name && <span>by {a.created_by_name}</span>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive" onClick={() => remove.mutate(a.id)}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
