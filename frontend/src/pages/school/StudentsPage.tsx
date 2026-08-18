import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { MoreHorizontal } from 'lucide-react'
import { useCreateStudent, useImportGuardians, useImportStudents, useStudents, useUpdateStudent } from '@/hooks/useStudents'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useBranches } from '@/hooks/useSchoolSetup'
import { TablePagination } from '@/components/school/TablePagination'
import type { GuardianImportResult, Student, StudentImportResult } from '@/types/students'

const editStudentNameSchema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
})

function EditStudentNameDialog({ student, onClose }: { student: Student; onClose: () => void }) {
  const update = useUpdateStudent(student.id)
  const form = useForm({
    resolver: zodResolver(editStudentNameSchema),
    defaultValues: { first_name: student.first_name, last_name: student.last_name },
  })

  function onSubmit(values: z.infer<typeof editStudentNameSchema>) {
    update.mutate(values, {
      onSuccess: () => {
        toast.success('Student updated')
        onClose()
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not update student')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit name</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="first_name"
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
              name="last_name"
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

const studentSchema = z.object({
  admission_number: z.string().min(1, 'Required'),
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
})

function CreateStudentDialog() {
  const [open, setOpen] = useQuickAddTrigger('student')
  const create = useCreateStudent()
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: { admission_number: '', first_name: '', last_name: '', date_of_birth: '', gender: '' },
  })

  function onSubmit(values: z.infer<typeof studentSchema>) {
    create.mutate(values, {
      onSuccess: () => {
        toast.success('Student created')
        form.reset()
        setOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not create student')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">New student</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New student</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="admission_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admission number</FormLabel>
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
                name="first_name"
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
                name="last_name"
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

function downloadImportTemplate() {
  const csv = 'admission_number,first_name,last_name,date_of_birth,gender,class_name\nADM-001,Amina,Hassan,2013-04-12,female,Form 1\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'student-import-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const IMPORT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  created: 'default',
  would_create: 'secondary',
  updated: 'default',
  would_update: 'secondary',
  error: 'destructive',
}

const IMPORT_STATUS_LABEL: Record<string, string> = {
  created: 'created',
  would_create: 'valid',
  updated: 'updated',
  would_update: 'will update',
  error: 'error',
}

function ImportResultTable({ result }: { result: StudentImportResult }) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Row</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Admission #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.map((row) => (
            <TableRow key={row.row}>
              <TableCell>{row.row}</TableCell>
              <TableCell className="font-medium">{row.name || '—'}</TableCell>
              <TableCell>{row.admission_number || '—'}</TableCell>
              <TableCell>
                <Badge variant={IMPORT_STATUS_VARIANT[row.status]}>{IMPORT_STATUS_LABEL[row.status]}</Badge>
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

function ImportStudentsDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [recalculateEnrollmentYear, setRecalculateEnrollmentYear] = useState(false)
  const [preview, setPreview] = useState<StudentImportResult | null>(null)
  const [committedResult, setCommittedResult] = useState<StudentImportResult | null>(null)
  const importStudents = useImportStudents()

  function reset() {
    setFile(null)
    setRecalculateEnrollmentYear(false)
    setPreview(null)
    setCommittedResult(null)
  }

  function handlePreview() {
    if (!file) return
    importStudents.mutate(
      { file, dryRun: true, recalculateEnrollmentYear },
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
    importStudents.mutate(
      { file, dryRun: false, recalculateEnrollmentYear },
      {
        onSuccess: (result) => {
          setCommittedResult(result)
          const parts = [`${result.created_count} created`]
          if (result.updated_count > 0) parts.push(`${result.updated_count} updated`)
          toast.success(parts.join(', '))
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
          <DialogTitle>Import students</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Columns: <code>admission_number</code>, <code>first_name</code>, <code>last_name</code> (required),
              plus optional <code>date_of_birth</code>, <code>gender</code>, <code>class_name</code>. A row whose
              admission number already exists <span className="font-medium">updates</span> that student instead of
              creating a duplicate — including assigning <code>class_name</code> and calculating their Enrollment
              Year from it.
            </p>
            <Button type="button" variant="link" size="sm" className="shrink-0" onClick={downloadImportTemplate}>
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

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={recalculateEnrollmentYear}
              onCheckedChange={(checked) => {
                setRecalculateEnrollmentYear(Boolean(checked))
                setPreview(null)
                setCommittedResult(null)
              }}
            />
            <span>
              Recalculate Enrollment Year for existing students
              <span className="block text-xs text-muted-foreground">
                Off by default — a student who already has an Enrollment Year keeps it, even if their class changed.
                Only turn this on for a deliberate correction pass.
              </span>
            </span>
          </label>

          {committedResult ? (
            <>
              <p className="text-sm">
                <span className="font-medium text-primary">{committedResult.created_count} created</span>
                {committedResult.updated_count > 0 && `, ${committedResult.updated_count} updated`}
                {committedResult.class_assigned_count > 0 && `, ${committedResult.class_assigned_count} classes assigned`}
                {committedResult.enrollment_year_calculated_count > 0
                  && `, ${committedResult.enrollment_year_calculated_count} enrollment years calculated`}
                {committedResult.error_count > 0 && `, ${committedResult.error_count} skipped`}
              </p>
              <ImportResultTable result={committedResult} />
            </>
          ) : preview ? (
            <>
              <p className="text-sm">
                <span className="font-medium">{preview.created_count + preview.updated_count} of {preview.total_rows} rows are valid</span>
                {preview.updated_count > 0 && ` (${preview.updated_count} will update existing students)`}
                {preview.error_count > 0 && ` — ${preview.error_count} will be skipped`}
              </p>
              <ImportResultTable result={preview} />
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
              <Button
                onClick={handleConfirm}
                disabled={importStudents.isPending || preview.created_count + preview.updated_count === 0}
              >
                {importStudents.isPending
                  ? 'Importing…'
                  : `Confirm import (${preview.created_count + preview.updated_count})`}
              </Button>
            </>
          ) : (
            <Button onClick={handlePreview} disabled={!file || importStudents.isPending}>
              {importStudents.isPending ? 'Reading…' : 'Preview'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function downloadGuardianImportTemplate() {
  const csv =
    'student_admission_number,guardian_name,relationship,phone,email,occupation,address,is_primary,is_emergency_contact\n'
    + 'ADM-001,Hassan Ali,Father,+255700000101,hassan.ali@example.com,Business Owner,"Mikocheni, Dar es Salaam",yes,yes\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'guardian-import-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const GUARDIAN_IMPORT_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  created: 'default',
  would_create: 'secondary',
  error: 'destructive',
}

function GuardianImportResultTable({ result }: { result: GuardianImportResult }) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Row</TableHead>
            <TableHead>Guardian</TableHead>
            <TableHead>Admission #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {result.rows.map((row) => (
            <TableRow key={row.row}>
              <TableCell>{row.row}</TableCell>
              <TableCell className="font-medium">{row.name || '—'}</TableCell>
              <TableCell>{row.admission_number || '—'}</TableCell>
              <TableCell>
                <Badge variant={GUARDIAN_IMPORT_STATUS_VARIANT[row.status]}>
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

function ImportGuardiansDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<GuardianImportResult | null>(null)
  const [committedResult, setCommittedResult] = useState<GuardianImportResult | null>(null)
  const importGuardians = useImportGuardians()

  function reset() {
    setFile(null)
    setPreview(null)
    setCommittedResult(null)
  }

  function handlePreview() {
    if (!file) return
    importGuardians.mutate(
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
    importGuardians.mutate(
      { file, dryRun: false },
      {
        onSuccess: (result) => {
          setCommittedResult(result)
          toast.success(`Imported ${result.created_count} guardian link(s)`)
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
          Import guardians
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import guardians</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Columns: <code>student_admission_number</code>, <code>guardian_name</code>, <code>relationship</code>{' '}
              (required), plus optional <code>phone</code>, <code>email</code>, <code>occupation</code>,{' '}
              <code>address</code>, <code>is_primary</code>, <code>is_emergency_contact</code>. Students must already
              be imported. A guardian with an email is emailed a Parent Portal activation link.
            </p>
            <Button type="button" variant="link" size="sm" className="shrink-0" onClick={downloadGuardianImportTemplate}>
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
                <span className="font-medium text-primary">{committedResult.created_count} linked</span>
                {committedResult.error_count > 0 && `, ${committedResult.error_count} skipped`}
              </p>
              <GuardianImportResultTable result={committedResult} />
            </>
          ) : preview ? (
            <>
              <p className="text-sm">
                <span className="font-medium">{preview.created_count} of {preview.total_rows} rows are valid</span>
                {preview.error_count > 0 && ` — ${preview.error_count} will be skipped`}
              </p>
              <GuardianImportResultTable result={preview} />
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
              <Button onClick={handleConfirm} disabled={importGuardians.isPending || preview.created_count === 0}>
                {importGuardians.isPending ? 'Importing…' : `Confirm import (${preview.created_count})`}
              </Button>
            </>
          ) : (
            <Button onClick={handlePreview} disabled={!file || importGuardians.isPending}>
              {importGuardians.isPending ? 'Reading…' : 'Preview'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const ALL_BRANCHES = '__all'
const STUDENTS_PER_PAGE = 100

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [page, setPage] = useState(1)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const { data: branches } = useBranches.useList()
  const { data, isLoading } = useStudents(search, branchId, page, STUDENTS_PER_PAGE)

  function handleSearchChange(next: string) {
    setSearch(next)
    setPage(1)
  }

  function handleBranchChange(next: string) {
    setBranchId(next)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">Student profiles, guardians, and enrollment.</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportStudentsDialog />
          <ImportGuardiansDialog />
          <CreateStudentDialog />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All students</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Input
                placeholder="Search by name or admission number…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="max-w-xs"
              />
              {branches && branches.length > 0 && (
                <Select
                  value={branchId || ALL_BRANCHES}
                  onValueChange={(v) => handleBranchChange(v === ALL_BRANCHES ? '' : v)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Branch</TableHead>
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
              {!isLoading && data?.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No students yet.
                  </TableCell>
                </TableRow>
              )}
              {data?.data.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <Link to={`/app/students/${student.id}`} className="hover:underline">
                      {student.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{student.admission_number}</TableCell>
                  <TableCell>
                    {student.current_enrollment?.school_class_name ?? '—'}
                    {student.current_enrollment?.stream_name ? ` (${student.current_enrollment.stream_name})` : ''}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{student.current_enrollment?.branch_name ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>{student.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingStudent(student)}>Edit name</DropdownMenuItem>
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
        </CardContent>
      </Card>
      {editingStudent && (
        <EditStudentNameDialog student={editingStudent} onClose={() => setEditingStudent(null)} />
      )}
    </div>
  )
}
