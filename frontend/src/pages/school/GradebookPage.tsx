import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { AlertTriangle, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { GradeDistribution } from '@/components/school/GradeDistribution'
import { useExamSubject, useRecordExamMarks, useSubmitExamSubject } from '@/hooks/useExams'
import { useCreateExamEditRequest } from '@/hooks/useExamEditRequests'
import { rankByMarks } from '@/lib/ranking'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString()
}

export function GradebookPage() {
  const { id } = useParams<{ id: string }>()
  const examSubjectId = id ?? ''
  const { data: examSubject, isLoading } = useExamSubject(examSubjectId)
  const record = useRecordExamMarks(examSubjectId)
  const submitGradebook = useSubmitExamSubject(examSubjectId)
  const requestEdit = useCreateExamEditRequest(examSubjectId)
  const [rows, setRows] = useState<Record<string, { marks: string; remarks: string }>>({})
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false)
  const [requestEditOpen, setRequestEditOpen] = useState(false)
  const [editReason, setEditReason] = useState('')

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

  function handleConfirmSubmit() {
    submitGradebook.mutate(undefined, {
      onSuccess: () => {
        toast.success('Gradebook submitted')
        setConfirmSubmitOpen(false)
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not submit gradebook')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  function handleRequestEdit() {
    if (!editReason.trim()) return
    requestEdit.mutate(editReason.trim(), {
      onSuccess: () => {
        toast.success('Edit request sent to the Academic Master')
        setRequestEditOpen(false)
        setEditReason('')
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not send the edit request')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  const isLocked = examSubject.is_locked
  const pendingEditRequest = examSubject.my_edit_request?.status === 'pending' ? examSubject.my_edit_request : null

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

      {isLocked && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-2">
            <p className="font-medium">This gradebook is locked.</p>
            <p>
              It was submitted more than 24 hours ago and can no longer be edited until the Academic Master approves
              an edit request.
            </p>
            {pendingEditRequest ? (
              <p className="font-medium">
                Edit request sent {formatDateTime(pendingEditRequest.created_at)} — waiting on Academic Master approval.
              </p>
            ) : (
              <Button size="sm" variant="outline" className="border-destructive/40" onClick={() => setRequestEditOpen(true)}>
                Request edit access
              </Button>
            )}
          </div>
        </div>
      )}

      {!isLocked && examSubject.edit_locked_at && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-600/30 bg-yellow-500/10 p-4 text-sm text-yellow-800 dark:text-yellow-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Check your records before 24 hours — the system will close and lock this gradebook to the class Academic
            Master at <span className="font-medium">{formatDateTime(examSubject.edit_locked_at)}</span>.
          </p>
        </div>
      )}

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
                      disabled={isLocked}
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
                      disabled={isLocked}
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
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={handleSave} disabled={record.isPending || isLocked}>
                {record.isPending ? 'Saving…' : 'Save marks'}
              </Button>
              {!examSubject.submitted_at && (
                <Button variant="outline" onClick={() => setConfirmSubmitOpen(true)}>
                  Submit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {examSubject.submitted_at && (
        <Card>
          <CardHeader>
            <CardTitle>Result summary</CardTitle>
            <CardDescription>How many students landed in each grade band.</CardDescription>
          </CardHeader>
          <CardContent>
            <GradeDistribution grades={examSubject.results?.map((r) => r.grade) ?? []} title="" />
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit this gradebook?</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 pt-2 text-sm text-foreground">
                <p className="font-medium text-destructive">
                  Once submitted, you won't be able to change these marks — until you have prior permission from the
                  Academic Master.
                </p>
                <p>
                  You'll have a 24-hour window right after submitting to fix any mistakes. After that, the gradebook
                  closes and any further change needs an approved edit request.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSubmitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={submitGradebook.isPending}>
              {submitGradebook.isPending ? 'Submitting…' : 'Yes, submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestEditOpen} onOpenChange={setRequestEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request edit access</DialogTitle>
            <DialogDescription>
              Tell the Academic Master why this gradebook needs to be reopened. They'll review and approve or reject
              your request.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="e.g. I transposed two students' scores by mistake."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestEdit} disabled={requestEdit.isPending || !editReason.trim()}>
              {requestEdit.isPending ? 'Sending…' : 'Send request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
