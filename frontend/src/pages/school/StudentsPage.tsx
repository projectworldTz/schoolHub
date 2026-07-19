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
import { useCreateStudent, useImportStudents, useStudents } from '@/hooks/useStudents'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useBranches } from '@/hooks/useSchoolSetup'
import type { StudentImportResult } from '@/types/students'

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
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
  error: 'destructive',
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
                <Badge variant={IMPORT_STATUS_VARIANT[row.status]}>
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

function ImportStudentsDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<StudentImportResult | null>(null)
  const [committedResult, setCommittedResult] = useState<StudentImportResult | null>(null)
  const importStudents = useImportStudents()

  function reset() {
    setFile(null)
    setPreview(null)
    setCommittedResult(null)
  }

  function handlePreview() {
    if (!file) return
    importStudents.mutate(
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
    importStudents.mutate(
      { file, dryRun: false },
      {
        onSuccess: (result) => {
          setCommittedResult(result)
          toast.success(`Imported ${result.created_count} student(s)`)
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
              plus optional <code>date_of_birth</code>, <code>gender</code>, <code>class_name</code>.
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

          {committedResult ? (
            <>
              <p className="text-sm">
                <span className="font-medium text-primary">{committedResult.created_count} created</span>
                {committedResult.error_count > 0 && `, ${committedResult.error_count} skipped`}
              </p>
              <ImportResultTable result={committedResult} />
            </>
          ) : preview ? (
            <>
              <p className="text-sm">
                <span className="font-medium">{preview.created_count} of {preview.total_rows} rows are valid</span>
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
              <Button onClick={handleConfirm} disabled={importStudents.isPending || preview.created_count === 0}>
                {importStudents.isPending ? 'Importing…' : `Confirm import (${preview.created_count})`}
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

const ALL_BRANCHES = '__all'

export function StudentsPage() {
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const { data: branches } = useBranches.useList()
  const { data, isLoading } = useStudents(search, branchId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-muted-foreground">Student profiles, guardians, and enrollment.</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportStudentsDialog />
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
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
              {branches && branches.length > 0 && (
                <Select value={branchId || ALL_BRANCHES} onValueChange={(v) => setBranchId(v === ALL_BRANCHES ? '' : v)}>
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Admission #</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
