import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { MoreHorizontal } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useCreateStaff,
  useStaffContracts,
  useStaffList,
  useSyncTeacherSubjects,
  useUpdateStaff,
} from '@/hooks/useStaff'
import { useBranches } from '@/hooks/useSchoolSetup'
import {
  useCreateLeaveRequest,
  useDeleteLeaveRequest,
  useLeaveRequests,
  useReviewLeaveRequest,
} from '@/hooks/useStaff'
import { useSchoolUsers } from '@/hooks/useSchoolUsers'
import { useSubjects } from '@/hooks/useAcademics'
import { useCurrentUser } from '@/hooks/useAuth'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useMarkStaffAttendance, useStaffAttendanceRegister } from '@/hooks/useStaffAttendance'
import { apiOrigin } from '@/api/client'
import type { StaffProfile } from '@/types/staff'
import type { StaffAttendanceStatus } from '@/types/staffAttendance'

const staffSchema = z.object({
  user_id: z.string().min(1, 'Select a user'),
  staff_number: z.string().min(1, 'Required'),
  job_title: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract']),
  hire_date: z.string().optional(),
  branch_id: z.string().optional(),
})

const NO_BRANCH = '__none'

function CreateStaffDialog() {
  const [open, setOpen] = useQuickAddTrigger('staff')
  const { data: users } = useSchoolUsers()
  const { data: branches } = useBranches.useList()
  const create = useCreateStaff()
  const form = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      user_id: '',
      staff_number: '',
      job_title: '',
      employment_type: 'full_time' as const,
      hire_date: '',
      branch_id: '',
    },
  })

  function onSubmit(values: z.infer<typeof staffSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Staff profile created')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not create staff profile')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New staff profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New staff profile</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.data.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.roles.join(', ')})
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
              name="staff_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Staff number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
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
                name="employment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full_time">Full time</SelectItem>
                        <SelectItem value="part_time">Part time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hire date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="branch_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch (optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="No branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function StaffBranchCell({ staff, branches }: { staff: StaffProfile; branches: { id: string; name: string }[] }) {
  const update = useUpdateStaff()

  return (
    <Select
      value={staff.branch_id ?? NO_BRANCH}
      onValueChange={(value) =>
        update.mutate({
          id: staff.id,
          payload: {
            user_id: staff.user_id,
            staff_number: staff.staff_number,
            branch_id: value === NO_BRANCH ? undefined : value,
          },
        })
      }
    >
      <SelectTrigger className="h-8 w-40">
        <SelectValue placeholder="No branch" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_BRANCH}>No branch</SelectItem>
        {branches.map((b) => (
          <SelectItem key={b.id} value={b.id}>
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SubjectAssignmentEditor({ staff }: { staff: StaffProfile }) {
  const { data: subjects } = useSubjects.useList()
  const sync = useSyncTeacherSubjects()
  const currentIds = new Set((staff.subjects_taught ?? []).map((s) => s.id))

  function toggle(subjectId: string, checked: boolean) {
    const next = new Set(currentIds)
    if (checked) next.add(subjectId)
    else next.delete(subjectId)

    sync.mutate(
      { staffId: staff.id, subjectIds: Array.from(next) },
      {
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update subjects')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="space-y-2 p-1">
      {subjects?.map((subject) => (
        <label key={subject.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={currentIds.has(subject.id)}
            onCheckedChange={(checked) => toggle(subject.id, checked === true)}
          />
          {subject.name}
        </label>
      ))}
    </div>
  )
}

function StaffTab() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useStaffList(search)
  const { data: branches } = useBranches.useList()
  const [subjectsFor, setSubjectsFor] = useState<StaffProfile | null>(null)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 max-w-xs"
            />
          </CardDescription>
        </div>
        <CreateStaffDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Staff #</TableHead>
              <TableHead>Branch</TableHead>
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
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No staff profiles yet.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((staff) => (
              <TableRow key={staff.id}>
                <TableCell className="font-medium">{staff.name}</TableCell>
                <TableCell>{staff.job_title ?? '—'}</TableCell>
                <TableCell className="space-x-1">
                  {staff.roles?.map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>{staff.staff_number}</TableCell>
                <TableCell>
                  <StaffBranchCell staff={staff} branches={branches ?? []} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {staff.roles?.includes('Teacher') && (
                        <DropdownMenuItem onClick={() => setSubjectsFor(staff)}>
                          Assign subjects
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={Boolean(subjectsFor)} onOpenChange={(open) => !open && setSubjectsFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subjects taught — {subjectsFor?.name}</DialogTitle>
            </DialogHeader>
            {subjectsFor && <SubjectAssignmentEditor staff={subjectsFor} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

const leaveSchema = z.object({
  leave_type: z.string().min(1, 'Required'),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  reason: z.string().optional(),
})

function CreateLeaveDialog() {
  const [open, setOpen] = useState(false)
  const create = useCreateLeaveRequest()
  const form = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: { leave_type: '', start_date: '', end_date: '', reason: '' },
  })

  function onSubmit(values: z.infer<typeof leaveSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Leave request submitted')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not submit leave request')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New leave request</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New leave request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="leave_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave type</FormLabel>
                  <FormControl>
                    <Input placeholder="sick, annual, maternity…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

function LeaveRequestsTab() {
  const { data, isLoading } = useLeaveRequests()
  const review = useReviewLeaveRequest()
  const remove = useDeleteLeaveRequest()
  const { data: currentUser } = useCurrentUser()
  const canManage = currentUser?.permissions.includes('staff.manage')

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>
            {canManage ? 'All staff leave requests.' : 'Your leave requests.'}
          </CardDescription>
        </div>
        <CreateLeaveDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {canManage && <TableHead>Staff</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                  No leave requests.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((leave) => (
              <TableRow key={leave.id}>
                {canManage && <TableCell>{leave.user_name}</TableCell>}
                <TableCell className="capitalize">{leave.leave_type}</TableCell>
                <TableCell>
                  {leave.start_date.slice(0, 10)} – {leave.end_date.slice(0, 10)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'secondary'
                    }
                  >
                    {leave.status}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-1">
                  {canManage && leave.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => review.mutate({ id: leave.id, status: 'approved' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => review.mutate({ id: leave.id, status: 'rejected' })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {!canManage && leave.status === 'pending' && (
                    <Button size="sm" variant="ghost" onClick={() => remove.mutate(leave.id)}>
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ContractsTab() {
  const { data: staffList } = useStaffList('')
  const [staffId, setStaffId] = useState<string | undefined>(undefined)
  const { data: contracts, isLoading } = useStaffContracts(staffId ?? '')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contracts</CardTitle>
        <CardDescription>View and download a staff member's contract letters.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={staffId} onValueChange={setStaffId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Select a staff member" />
          </SelectTrigger>
          <SelectContent>
            {staffList?.data.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {staffId && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead className="w-32" />
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
              {!isLoading && contracts?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No contracts recorded for this staff member.
                  </TableCell>
                </TableRow>
              )}
              {contracts?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.contract_type}</TableCell>
                  <TableCell>{c.start_date?.slice(0, 10)}</TableCell>
                  <TableCell>{c.end_date?.slice(0, 10) ?? 'Ongoing'}</TableCell>
                  <TableCell>{c.salary ? Number(c.salary).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`${apiOrigin}/api/school/staff-contracts/${c.id}/document`, '_blank')}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

const STAFF_ATTENDANCE_OPTIONS: { value: StaffAttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
  { value: 'on_leave', label: 'On leave' },
]

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function StaffAttendanceTab() {
  const [date, setDate] = useState(todayIsoDate())
  const [rows, setRows] = useState<Record<string, { status: StaffAttendanceStatus; remarks: string }>>({})
  const { data: register, isLoading } = useStaffAttendanceRegister({ date })
  const mark = useMarkStaffAttendance()

  useEffect(() => {
    if (!register) return
    const initial: Record<string, { status: StaffAttendanceStatus; remarks: string }> = {}
    for (const row of register) {
      initial[row.user_id] = { status: row.status ?? 'present', remarks: row.remarks ?? '' }
    }
    setRows(initial)
  }, [register])

  function handleSave() {
    if (!register) return
    mark.mutate(
      {
        date,
        records: register.map((row) => ({
          user_id: row.user_id,
          status: rows[row.user_id]?.status ?? 'present',
          remarks: rows[row.user_id]?.remarks || undefined,
        })),
      },
      {
        onSuccess: () => toast.success('Staff attendance saved'),
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not save attendance')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          <div className="mt-2 flex flex-wrap gap-3">
            <Input type="date" className="w-48" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead className="w-40">Status</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && register?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No active staff found.
                </TableCell>
              </TableRow>
            )}
            {register?.map((row) => (
              <TableRow key={row.user_id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{row.job_title ?? '—'}</TableCell>
                <TableCell>
                  <Select
                    value={rows[row.user_id]?.status ?? 'present'}
                    onValueChange={(value) =>
                      setRows((prev) => ({
                        ...prev,
                        [row.user_id]: { ...prev[row.user_id], status: value as StaffAttendanceStatus, remarks: prev[row.user_id]?.remarks ?? '' },
                      }))
                    }
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAFF_ATTENDANCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={rows[row.user_id]?.remarks ?? ''}
                    onChange={(e) =>
                      setRows((prev) => ({
                        ...prev,
                        [row.user_id]: { status: prev[row.user_id]?.status ?? 'present', remarks: e.target.value },
                      }))
                    }
                    placeholder="Optional"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {register && register.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={mark.isPending}>
              {mark.isPending ? 'Saving…' : 'Save attendance'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function StaffPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="text-sm text-muted-foreground">Staff profiles, subject assignment, and leave.</p>
      </div>
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Requests</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>
        <TabsContent value="staff" className="mt-4">
          <StaffTab />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <StaffAttendanceTab />
        </TabsContent>
        <TabsContent value="leave" className="mt-4">
          <LeaveRequestsTab />
        </TabsContent>
        <TabsContent value="contracts" className="mt-4">
          <ContractsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
