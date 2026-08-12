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
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Combobox } from '@/components/ui/combobox'
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
  useImportTeachers,
  useRemoveStaff,
  useStaffContracts,
  useStaffList,
  useSyncTeacherClasses,
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
import { useClasses, useSubjects } from '@/hooks/useAcademics'
import { useCurrentUser } from '@/hooks/useAuth'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useMarkStaffAttendance, useStaffAttendanceRegister } from '@/hooks/useStaffAttendance'
import { TablePagination } from '@/components/school/TablePagination'
import { apiOrigin } from '@/api/client'
import type { StaffProfile, TeacherImportResult } from '@/types/staff'
import type { StaffAttendanceStatus } from '@/types/staffAttendance'

const staffSchema = z
  .object({
    user_id: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    staff_number: z.string().min(1, 'Required'),
    job_title: z.string().optional(),
    employment_type: z.enum(['full_time', 'part_time', 'contract']),
    hire_date: z.string().optional(),
    branch_id: z.string().optional(),
  })
  .refine((data) => Boolean(data.user_id) || Boolean(data.name?.trim()), {
    message: 'Select a user, or switch to "No login" and enter a name',
    path: ['user_id'],
  })

const NO_BRANCH = '__none'

function CreateStaffDialog() {
  const [open, setOpen] = useQuickAddTrigger('staff')
  const [noLogin, setNoLogin] = useState(false)
  // per_page bumped well past the default 100 — this list is filtered
  // client-side in the Combobox below, so the full roster needs to be in
  // memory upfront (a school pushing 200 staff would otherwise silently
  // lose anyone past the 100th to the picker).
  const { data: users } = useSchoolUsers({ per_page: 1000 })
  const { data: branches } = useBranches.useList()
  const create = useCreateStaff()
  const form = useForm({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      user_id: '',
      name: '',
      phone: '',
      staff_number: '',
      job_title: '',
      employment_type: 'full_time' as const,
      hire_date: '',
      branch_id: '',
    },
  })

  function onSubmit(values: z.infer<typeof staffSchema>) {
    const payload = noLogin
      ? {
          name: values.name,
          phone: values.phone || undefined,
          staff_number: values.staff_number,
          job_title: values.job_title || undefined,
          employment_type: values.employment_type,
          hire_date: values.hire_date || undefined,
          branch_id: values.branch_id || undefined,
        }
      : {
          user_id: values.user_id,
          staff_number: values.staff_number,
          job_title: values.job_title || undefined,
          employment_type: values.employment_type,
          hire_date: values.hire_date || undefined,
          branch_id: values.branch_id || undefined,
        }

    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Staff profile created')
        form.reset()
        setNoLogin(false)
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
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={noLogin}
                onCheckedChange={(checked) => {
                  setNoLogin(Boolean(checked))
                  form.clearErrors('user_id')
                }}
              />
              No login needed (support staff — cook, driver, gate keeper…)
            </label>
            {noLogin ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Combobox
                      options={(users?.data ?? []).map((u) => ({
                        value: u.id,
                        label: u.name,
                        sublabel: u.roles.join(', '),
                      }))}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Select a staff member"
                      searchPlaceholder="Search by name…"
                      emptyText="No user found."
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
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

const editStaffSchema = z.object({
  staff_number: z.string().min(1, 'Required'),
  job_title: z.string().optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract']),
  hire_date: z.string().optional(),
  branch_id: z.string().optional(),
})

function EditStaffDialog({
  staff,
  branches,
  onOpenChange,
}: {
  staff: StaffProfile
  branches: { id: string; name: string }[]
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateStaff()
  const form = useForm({
    resolver: zodResolver(editStaffSchema),
    defaultValues: {
      staff_number: staff.staff_number,
      job_title: staff.job_title ?? '',
      employment_type: staff.employment_type,
      hire_date: staff.hire_date?.slice(0, 10) ?? '',
      branch_id: staff.branch_id ?? '',
    },
  })

  function onSubmit(values: z.infer<typeof editStaffSchema>) {
    update.mutate(
      {
        id: staff.id,
        payload: {
          staff_number: values.staff_number,
          job_title: values.job_title || undefined,
          employment_type: values.employment_type,
          hire_date: values.hire_date || undefined,
          branch_id: values.branch_id || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Staff profile updated')
          onOpenChange(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update staff profile')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit staff profile — {staff.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {branches.map((b) => (
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
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Saving…' : 'Save'}
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

function ClassAssignmentEditor({ staff }: { staff: StaffProfile }) {
  const { data: classes } = useClasses.useList()
  const sync = useSyncTeacherClasses()
  const currentIds = new Set((staff.classes_assigned ?? []).map((c) => c.id))

  function toggle(classId: string, checked: boolean) {
    const next = new Set(currentIds)
    if (checked) next.add(classId)
    else next.delete(classId)

    sync.mutate(
      { staffId: staff.id, classIds: Array.from(next) },
      {
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not update classes')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="space-y-2 p-1">
      {classes?.map((schoolClass) => (
        <label key={schoolClass.id} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={currentIds.has(schoolClass.id)}
            onCheckedChange={(checked) => toggle(schoolClass.id, checked === true)}
          />
          {schoolClass.name}
        </label>
      ))}
    </div>
  )
}

function downloadTeacherImportTemplate() {
  const csv =
    'full_name,email,phone,role,staff_number,job_title,employment_type,hire_date,class_assigned\n'
    + 'Grace Mwakalinga,grace.mwakalinga@example.com,+255700000001,Class Teacher,STF-001,Class Teacher - Standard 1,full_time,2026-01-05,Standard 1\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'teacher-import-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const TEACHER_IMPORT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  created: 'default',
  would_create: 'secondary',
  error: 'destructive',
}

function TeacherImportResultTable({ result }: { result: TeacherImportResult }) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Row</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.map((row) => (
            <TableRow key={row.row}>
              <TableCell>{row.row}</TableCell>
              <TableCell className="font-medium">{row.name || '—'}</TableCell>
              <TableCell>{row.email || '—'}</TableCell>
              <TableCell>
                <Badge variant={TEACHER_IMPORT_STATUS_VARIANT[row.status]}>
                  {row.status === 'would_create' ? 'valid' : row.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {[...row.errors, ...row.warnings].join(' ') || '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ImportTeachersDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<TeacherImportResult | null>(null)
  const [committedResult, setCommittedResult] = useState<TeacherImportResult | null>(null)
  const importTeachers = useImportTeachers()

  function reset() {
    setFile(null)
    setPreview(null)
    setCommittedResult(null)
  }

  function handlePreview() {
    if (!file) return
    importTeachers.mutate(
      { file, dryRun: true },
      {
        onSuccess: (result) => {
          if (result.missing_headers.length > 0) {
            toast.error(`Missing required columns: ${result.missing_headers.join(', ')}`)
            return
          }
          setPreview(result)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not read that file')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  function handleConfirm() {
    if (!file) return
    importTeachers.mutate(
      { file, dryRun: false },
      {
        onSuccess: (result) => {
          setCommittedResult(result)
          toast.success(`Imported ${result.created_count} teacher(s) — activation emails sent`)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Import failed')
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
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import teachers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Columns: <code>full_name</code>, <code>email</code>, <code>role</code> (required), plus optional{' '}
              <code>phone</code>, <code>staff_number</code>, <code>job_title</code>, <code>employment_type</code>,{' '}
              <code>hire_date</code>, <code>class_assigned</code>. Each teacher is emailed an activation link.
            </p>
            <Button type="button" variant="link" size="sm" className="shrink-0" onClick={downloadTeacherImportTemplate}>
              Download template
            </Button>
          </div>

          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setPreview(null)
              setCommittedResult(null)
            }}
          />

          {committedResult ? (
            <>
              <p className="text-sm">
                <span className="font-medium text-primary">{committedResult.created_count} created</span>
                {committedResult.error_count > 0 && `, ${committedResult.error_count} skipped`}
              </p>
              <TeacherImportResultTable result={committedResult} />
            </>
          ) : preview ? (
            <>
              <p className="text-sm">
                <span className="font-medium">{preview.created_count} of {preview.total_rows} rows are valid</span>
                {preview.error_count > 0 && ` — ${preview.error_count} will be skipped`}
              </p>
              <TeacherImportResultTable result={preview} />
            </>
          ) : null}
        </div>

        <DialogFooter>
          {committedResult ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : preview ? (
            <>
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
              <Button onClick={handleConfirm} disabled={importTeachers.isPending || preview.created_count === 0}>
                {importTeachers.isPending ? 'Importing…' : `Confirm import (${preview.created_count})`}
              </Button>
            </>
          ) : (
            <Button onClick={handlePreview} disabled={!file || importTeachers.isPending}>
              {importTeachers.isPending ? 'Reading…' : 'Preview'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const STAFF_PER_PAGE = 100

function StaffTab() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useStaffList(search, page, STAFF_PER_PAGE)
  const { data: branches } = useBranches.useList()
  const [subjectsFor, setSubjectsFor] = useState<StaffProfile | null>(null)
  const [classesFor, setClassesFor] = useState<StaffProfile | null>(null)
  const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const remove = useRemoveStaff()

  function handleSearchChange(next: string) {
    setSearch(next)
    setPage(1)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            <Input
              placeholder="Search by name…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="mt-2 max-w-xs"
            />
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ImportTeachersDialog />
          <CreateStaffDialog />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  {staff.has_login ? (
                    staff.roles?.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      No login
                    </Badge>
                  )}
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
                      <DropdownMenuItem onClick={() => setEditingStaff(staff)}>Edit</DropdownMenuItem>
                      {staff.roles?.includes('Teacher') && (
                        <DropdownMenuItem onClick={() => setSubjectsFor(staff)}>
                          Assign subjects
                        </DropdownMenuItem>
                      )}
                      {staff.roles?.includes('Teacher') && (
                        <DropdownMenuItem onClick={() => setClassesFor(staff)}>
                          Assign classes
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setPendingRemoveId(staff.id)}
                      >
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
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

        <Dialog open={Boolean(subjectsFor)} onOpenChange={(open) => !open && setSubjectsFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subjects taught — {subjectsFor?.name}</DialogTitle>
            </DialogHeader>
            {subjectsFor && <SubjectAssignmentEditor staff={subjectsFor} />}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(classesFor)} onOpenChange={(open) => !open && setClassesFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Classes assigned — {classesFor?.name}</DialogTitle>
            </DialogHeader>
            {classesFor && <ClassAssignmentEditor staff={classesFor} />}
          </DialogContent>
        </Dialog>

        {editingStaff && (
          <EditStaffDialog
            staff={editingStaff}
            branches={branches ?? []}
            onOpenChange={(open) => !open && setEditingStaff(null)}
          />
        )}

        <ConfirmDialog
          open={pendingRemoveId !== null}
          onOpenChange={(open) => !open && setPendingRemoveId(null)}
          title="Remove this staff profile?"
          description="This can't be undone. Their user login (if any) is not deleted, only the staff record."
          confirmLabel="Remove"
          onConfirm={() => {
            if (pendingRemoveId) {
              remove.mutate(pendingRemoveId, {
                onSuccess: () => toast.success('Staff profile removed'),
                onError: () => toast.error('Could not remove this staff profile'),
              })
            }
            setPendingRemoveId(null)
          }}
        />
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
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)

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
                    <Button size="sm" variant="ghost" onClick={() => setPendingCancelId(leave.id)}>
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <ConfirmDialog
        open={pendingCancelId !== null}
        onOpenChange={(open) => !open && setPendingCancelId(null)}
        title="Cancel this leave request?"
        description="This can't be undone."
        confirmLabel="Cancel request"
        onConfirm={() => {
          if (pendingCancelId) remove.mutate(pendingCancelId)
          setPendingCancelId(null)
        }}
      />
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
          <SelectTrigger className="w-full sm:w-72">
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
