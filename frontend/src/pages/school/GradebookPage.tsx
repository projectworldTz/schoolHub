import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useExamSubject, useRecordExamMarks } from '@/hooks/useExams'
import { rankByMarks } from '@/lib/ranking'

export function GradebookPage() {
  const { id } = useParams<{ id: string }>()
  const examSubjectId = id ?? ''
  const { data: examSubject, isLoading } = useExamSubject(examSubjectId)
  const record = useRecordExamMarks(examSubjectId)
  const [rows, setRows] = useState<Record<string, { marks: string; remarks: string }>>({})

  useEffect(() => {
    if (!examSubject?.results) return
    const initial: Record<string, { marks: string; remarks: string }> = {}
    for (const result of examSubject.results) {
      initial[result.student_id] = { marks: result.marks_obtained ?? '', remarks: result.remarks ?? '' }
    }
    setRows(initial)
  }, [examSubject?.results])

  if (isLoading || !examSubject) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  const ranks = rankByMarks(examSubject.results ?? [])
  const gradedCount = ranks.size

  function handleSave() {
    if (!examSubject?.results) return
    record.mutate(
      {
        records: examSubject.results.map((result) => ({
          student_id: result.student_id,
          marks_obtained: rows[result.student_id]?.marks ? Number(rows[result.student_id].marks) : null,
          remarks: rows[result.student_id]?.remarks || undefined,
        })),
      },
      {
        onSuccess: () => toast.success('Marks saved'),
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not save marks')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={`${examSubject.subject_name} gradebook`} />
      <div>
        <h1 className="text-2xl font-semibold">{examSubject.subject_name} — {examSubject.school_class_name}</h1>
        <p className="text-sm text-muted-foreground">
          Max marks {examSubject.max_marks}
          {examSubject.pass_marks ? ` · Pass marks ${examSubject.pass_marks}` : ''}
          {examSubject.exam_date ? ` · ${examSubject.exam_date}` : ''}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gradebook</CardTitle>
          <CardDescription>Enter marks for each student — grades are computed automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="w-32">Marks</TableHead>
                <TableHead className="w-24">Grade</TableHead>
                <TableHead className="w-24">Rank</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examSubject.results?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No students enrolled in this class.
                  </TableCell>
                </TableRow>
              )}
              {examSubject.results?.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.admission_number}</TableCell>
                  <TableCell className="font-medium">{result.student_name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      max={Number(examSubject.max_marks)}
                      value={rows[result.student_id]?.marks ?? ''}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [result.student_id]: { remarks: prev[result.student_id]?.remarks ?? '', marks: e.target.value },
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {result.grade ? <Badge>{result.grade}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-muted-foreground">
                    {ranks.has(result.student_id) ? `${ranks.get(result.student_id)} / ${gradedCount}` : '—'}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={rows[result.student_id]?.remarks ?? ''}
                      onChange={(e) =>
                        setRows((prev) => ({
                          ...prev,
                          [result.student_id]: { marks: prev[result.student_id]?.marks ?? '', remarks: e.target.value },
                        }))
                      }
                      placeholder="Optional"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {examSubject.results && examSubject.results.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} disabled={record.isPending}>
                {record.isPending ? 'Saving…' : 'Save marks'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
