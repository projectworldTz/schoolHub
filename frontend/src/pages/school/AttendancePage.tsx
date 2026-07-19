import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAttendanceRegister, useMarkAttendance } from '@/hooks/useAttendance'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useClasses } from '@/hooks/useAcademics'
import type { AttendanceStatus } from '@/types/attendance'

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
  { value: 'excused', label: 'Excused' },
]

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function AttendancePage() {
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const [academicYearId, setAcademicYearId] = useState('')
  const [schoolClassId, setSchoolClassId] = useState('')
  const [date, setDate] = useState(todayIsoDate())
  const [rows, setRows] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({})

  useEffect(() => {
    if (!academicYearId && academicYears?.length) {
      setAcademicYearId(academicYears.find((y) => y.is_current)?.id ?? academicYears[0].id)
    }
  }, [academicYears, academicYearId])

  const { data: register, isLoading } = useAttendanceRegister({
    school_class_id: schoolClassId,
    academic_year_id: academicYearId,
    date,
  })

  useEffect(() => {
    if (!register) return
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {}
    for (const row of register) {
      initial[row.student_id] = { status: row.status ?? 'present', remarks: row.remarks ?? '' }
    }
    setRows(initial)
  }, [register])

  const mark = useMarkAttendance()

  const canSave = useMemo(
    () => Boolean(schoolClassId && academicYearId && date && register && register.length > 0),
    [schoolClassId, academicYearId, date, register]
  )

  function handleSave() {
    if (!register) return
    mark.mutate(
      {
        school_class_id: schoolClassId,
        academic_year_id: academicYearId,
        date,
        records: register.map((row) => ({
          student_id: row.student_id,
          status: rows[row.student_id]?.status ?? 'present',
          remarks: rows[row.student_id]?.remarks || undefined,
        })),
      },
      {
        onSuccess: () => toast.success('Attendance saved'),
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground">Mark and review daily class attendance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap gap-3">
              <Select value={academicYearId} onValueChange={setAcademicYearId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears?.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={schoolClassId} onValueChange={setSchoolClassId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" className="w-48" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-40">Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!schoolClassId && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Choose a class and date to load the register.
                  </TableCell>
                </TableRow>
              )}
              {schoolClassId && isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {schoolClassId && !isLoading && register?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No students enrolled in this class for the selected year.
                  </TableCell>
                </TableRow>
              )}
              {register?.map((row) => (
                <TableRow key={row.student_id}>
                  <TableCell>{row.admission_number}</TableCell>
                  <TableCell className="font-medium">{row.full_name}</TableCell>
                  <TableCell>
                    <Select
                      value={rows[row.student_id]?.status ?? 'present'}
                      onValueChange={(value) =>
                        setRows((prev) => ({
                          ...prev,
                          [row.student_id]: { ...prev[row.student_id], status: value as AttendanceStatus, remarks: prev[row.student_id]?.remarks ?? '' },
                        }))
                      }
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rows[row.student_id]?.remarks ?? ''}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [row.student_id]: { status: prev[row.student_id]?.status ?? 'present', remarks: e.target.value },
                        }))
                      }
                      placeholder="Optional"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {canSave && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} disabled={mark.isPending}>
                {mark.isPending ? 'Saving…' : 'Save attendance'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
