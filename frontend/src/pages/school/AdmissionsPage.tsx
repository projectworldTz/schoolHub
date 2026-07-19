import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  useAcceptAdmission,
  useAdmissions,
  useCreateAdmission,
  useEnrollAdmission,
  useRejectAdmission,
} from '@/hooks/useAdmissions'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses } from '@/hooks/useAcademics'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import type { AdmissionStatus } from '@/types/admissions'

const STATUS_VARIANT: Record<AdmissionStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  under_review: 'secondary',
  accepted: 'default',
  rejected: 'destructive',
  enrolled: 'outline',
}

const admissionSchema = z.object({
  academic_year_id: z.string().min(1, 'Required'),
  applying_for_class_id: z.string().min(1, 'Required'),
  applicant_first_name: z.string().min(1, 'Required'),
  applicant_last_name: z.string().min(1, 'Required'),
  guardian_name: z.string().min(1, 'Required'),
  guardian_phone: z.string().min(1, 'Required'),
  guardian_email: z.string().email().optional().or(z.literal('')),
})

function CreateAdmissionDialog() {
  const [open, setOpen] = useQuickAddTrigger('admission')
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const create = useCreateAdmission()
  const form = useForm({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      academic_year_id: '',
      applying_for_class_id: '',
      applicant_first_name: '',
      applicant_last_name: '',
      guardian_name: '',
      guardian_phone: '',
      guardian_email: '',
    },
  })

  function onSubmit(values: z.infer<typeof admissionSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Application submitted')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not submit application')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New application</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New admission application</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="applicant_first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicant_last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
              name="applying_for_class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applying for class</FormLabel>
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
              name="guardian_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="guardian_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="guardian_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Guardian email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Submitting…' : 'Submit'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AdmissionsPage() {
  const [status, setStatus] = useState('')
  const { data, isLoading } = useAdmissions(status)
  const accept = useAcceptAdmission()
  const reject = useRejectAdmission()
  const enroll = useEnrollAdmission()

  function handleEnroll(id: string, name: string) {
    enroll.mutate(id, {
      onSuccess: () => toast.success(`${name} enrolled as a student`),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not enroll')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admissions</h1>
          <p className="text-sm text-muted-foreground">Applications, review, and enrollment.</p>
        </div>
        <CreateAdmissionDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            <Select value={status || 'all'} onValueChange={(v) => setStatus(v === 'all' ? '' : v)}>
              <SelectTrigger className="mt-2 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
              </SelectContent>
            </Select>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
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
              {!isLoading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No applications.
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.applicant_first_name} {app.applicant_last_name}
                  </TableCell>
                  <TableCell>{app.applying_for_class_name}</TableCell>
                  <TableCell>
                    {app.guardian_name} ({app.guardian_phone})
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[app.status]}>{app.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {(app.status === 'pending' || app.status === 'under_review') && (
                          <>
                            <DropdownMenuItem onClick={() => accept.mutate(app.id)}>Accept</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => reject.mutate({ id: app.id })}
                            >
                              Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {app.status === 'accepted' && (
                          <DropdownMenuItem
                            onClick={() => handleEnroll(app.id, `${app.applicant_first_name} ${app.applicant_last_name}`)}
                          >
                            Enroll as student
                          </DropdownMenuItem>
                        )}
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
