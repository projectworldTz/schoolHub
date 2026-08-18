import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useClasses } from '@/hooks/useAcademics'
import { useAcademicYears } from '@/hooks/useSchoolSetup'
import { useEligibleStudents } from '@/hooks/useGraduation'
import { useCommitPromotion, usePromotionHistory, usePromotionPreview } from '@/hooks/usePromotions'
import type { PromotionDecision, PromotionPreviewClass } from '@/types/promotions'

const ALL_YEARS = '__default'

function decisionForStudent(
  studentId: string,
  choice: string | undefined,
  classRow: PromotionPreviewClass
): PromotionDecision | null {
  const selected = choice ?? 'default'

  if (selected === 'exclude') return null
  if (selected === 'graduate') return { student_id: studentId, graduate: true }
  if (selected === 'repeat') return { student_id: studentId, to_school_class_id: classRow.from_school_class_id }
  if (selected === 'default') {
    return classRow.is_terminal
      ? { student_id: studentId, graduate: true }
      : { student_id: studentId, to_school_class_id: classRow.to_school_class_id ?? undefined }
  }

  // Anything else is a specific school_class_id the admin picked directly.
  return { student_id: studentId, to_school_class_id: selected }
}

function ClassPromotionRow({
  classRow,
  classes,
  selections,
  onSelect,
}: {
  classRow: PromotionPreviewClass
  classes: { id: string; name: string }[]
  selections: Record<string, string>
  onSelect: (studentId: string, value: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pendingCount = classRow.students.filter((s) => !s.already_promoted).length

  return (
    <div className="rounded-md border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-accent"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="font-medium">
          {classRow.from_school_class_name} → {classRow.to_school_class_name ?? 'Completed'}
        </span>
        <span className="text-muted-foreground">
          {pendingCount} student{pendingCount === 1 ? '' : 's'}
          {pendingCount !== classRow.students.length && ` (${classRow.students.length - pendingCount} already promoted)`}
        </span>
      </button>
      {expanded && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admission #</TableHead>
              <TableHead>Decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classRow.students.map((student) => (
              <TableRow key={student.student_id}>
                <TableCell className="font-medium">{student.name}</TableCell>
                <TableCell>{student.admission_number}</TableCell>
                <TableCell>
                  {student.already_promoted ? (
                    <Badge variant="secondary">Already promoted</Badge>
                  ) : (
                    <Select
                      value={selections[student.student_id] ?? 'default'}
                      onValueChange={(value) => onSelect(student.student_id, value)}
                    >
                      <SelectTrigger className="h-8 w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          {classRow.is_terminal ? 'Graduate (default)' : `Promote to ${classRow.to_school_class_name} (default)`}
                        </SelectItem>
                        <SelectItem value="repeat">Repeat {classRow.from_school_class_name}</SelectItem>
                        {!classRow.is_terminal && <SelectItem value="graduate">Graduate instead</SelectItem>}
                        {classes
                          .filter((c) => c.id !== classRow.to_school_class_id && c.id !== classRow.from_school_class_id)
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              Move to {c.name}
                            </SelectItem>
                          ))}
                        <SelectItem value="exclude">Exclude from this run</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

function ManualPromotionCard() {
  const { data: classes } = useClasses.useList()
  const { data: academicYears } = useAcademicYears.useList()
  const [fromClassId, setFromClassId] = useState('')
  const [fromYearId, setFromYearId] = useState('')
  const [toClassId, setToClassId] = useState('')
  const [toYearId, setToYearId] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const { data: eligible, isLoading } = useEligibleStudents({
    school_class_id: fromClassId || undefined,
    academic_year_id: fromYearId || undefined,
  })
  const commit = useCommitPromotion()

  const selectedIds = Object.keys(selected).filter((id) => selected[id])
  const allSelected = Boolean(eligible?.length) && eligible!.every((s) => selected[s.student_id])

  function toggleAll() {
    if (!eligible) return
    setSelected(allSelected ? {} : Object.fromEntries(eligible.map((s) => [s.student_id, true])))
  }

  function handleConfirm() {
    if (!toYearId || !toClassId || selectedIds.length === 0) return
    commit.mutate(
      {
        from_academic_year_id: fromYearId || undefined,
        to_academic_year_id: toYearId,
        mode: 'manual',
        decisions: selectedIds.map((student_id) => ({ student_id, to_school_class_id: toClassId })),
      },
      {
        onSuccess: (result) => {
          toast.success(`${result.promoted_count + result.repeated_count} student(s) moved`)
          setSelected({})
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not complete manual promotion')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual promotion</CardTitle>
        <CardDescription>
          For classes handled outside the annual cycle — e.g. Pre-Unit or Nursery — or to move specific students at
          any time. Pick a source class/year, a destination class/year, then choose who moves.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Select value={fromClassId || undefined} onValueChange={setFromClassId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="From class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fromYearId || undefined} onValueChange={setFromYearId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="From academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears?.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="self-center text-muted-foreground">→</span>
          <Select value={toClassId || undefined} onValueChange={setToClassId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="To class" />
            </SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={toYearId || undefined} onValueChange={setToYearId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="To academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears?.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {fromClassId && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Admission #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && eligible?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No active students in that class/year.
                  </TableCell>
                </TableRow>
              )}
              {eligible?.map((student) => (
                <TableRow key={student.student_id}>
                  <TableCell>
                    <Checkbox
                      checked={Boolean(selected[student.student_id])}
                      onCheckedChange={(checked) =>
                        setSelected((prev) => ({ ...prev, [student.student_id]: Boolean(checked) }))
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.admission_number}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!toYearId || !toClassId || selectedIds.length === 0 || commit.isPending}
        >
          {commit.isPending ? 'Moving…' : `Move ${selectedIds.length || ''} student(s)`.trim()}
        </Button>
      </CardContent>
    </Card>
  )
}

export function PromotionsPage() {
  const { data: academicYears } = useAcademicYears.useList()
  const { data: classes } = useClasses.useList()
  const [fromYearId, setFromYearId] = useState(ALL_YEARS)
  const [toYearId, setToYearId] = useState(ALL_YEARS)
  const [selections, setSelections] = useState<Record<string, string>>({})

  const { data: preview, isLoading } = usePromotionPreview({
    from_academic_year_id: fromYearId === ALL_YEARS ? undefined : fromYearId,
    to_academic_year_id: toYearId === ALL_YEARS ? undefined : toYearId,
  })
  const { data: history, isLoading: historyLoading } = usePromotionHistory()
  const commit = useCommitPromotion()

  function handleConfirm() {
    if (!preview?.to_academic_year) return

    const decisions = preview.classes.flatMap((classRow) =>
      classRow.students
        .filter((s) => !s.already_promoted)
        .map((s) => decisionForStudent(s.student_id, selections[s.student_id], classRow))
        .filter((d): d is NonNullable<typeof d> => d !== null)
    )

    if (decisions.length === 0) {
      toast.info('Nothing to promote — every student is either already promoted or excluded.')
      return
    }

    commit.mutate(
      {
        from_academic_year_id: preview.from_academic_year?.id,
        to_academic_year_id: preview.to_academic_year.id,
        mode: 'automatic',
        decisions,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `${result.promoted_count} promoted, ${result.repeated_count} repeated, ${result.graduated_count} graduated`
          )
          setSelections({})
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not complete promotion')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  const totalPending = preview?.classes.reduce((sum, c) => sum + c.students.filter((s) => !s.already_promoted).length, 0) ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Promotions</h1>
        <p className="text-sm text-muted-foreground">
          Review and confirm the annual class promotion, or move individual classes/students manually.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automatic promotion preview</CardTitle>
          <CardDescription>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Select value={fromYearId} onValueChange={setFromYearId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="From academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_YEARS}>Auto-detect (previous year)</SelectItem>
                  {academicYears?.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>→</span>
              <Select value={toYearId} onValueChange={setToYearId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="To academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_YEARS}>Auto-detect (current year)</SelectItem>
                  {academicYears?.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading preview…</p>}

          {!isLoading && (!preview?.from_academic_year || !preview?.to_academic_year) && (
            <p className="text-sm text-muted-foreground">
              Need two academic years to compare — set up a previous and a current academic year first.
            </p>
          )}

          {preview?.from_academic_year && preview?.to_academic_year && (
            <>
              <p className="text-sm">
                Promoting from <span className="font-medium">{preview.from_academic_year.name}</span> to{' '}
                <span className="font-medium">{preview.to_academic_year.name}</span>
              </p>

              <div className="space-y-2">
                {preview.classes.map((classRow) => (
                  <ClassPromotionRow
                    key={classRow.from_school_class_id}
                    classRow={classRow}
                    classes={classes ?? []}
                    selections={selections}
                    onSelect={(studentId, value) => setSelections((prev) => ({ ...prev, [studentId]: value }))}
                  />
                ))}
                {preview.classes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No auto-promotable classes have active students.</p>
                )}
              </div>

              {preview.manual_classes.length > 0 && (
                <div className="space-y-1 rounded-md border border-dashed p-3">
                  <p className="text-sm font-medium">Manual promotion required</p>
                  {preview.manual_classes.map((c) => (
                    <p key={c.school_class_id} className="text-sm text-muted-foreground">
                      {c.school_class_name} → {c.student_count} student{c.student_count === 1 ? '' : 's'} (use Manual
                      promotion below)
                    </p>
                  ))}
                </div>
              )}

              <Button onClick={handleConfirm} disabled={totalPending === 0 || commit.isPending}>
                {commit.isPending ? 'Promoting…' : `Confirm promotion (${totalPending})`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <ManualPromotionCard />

      <Card>
        <CardHeader>
          <CardTitle>Promotion history</CardTitle>
          <CardDescription>Every promotion, repeat, and graduation applied, most recent first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!historyLoading && history?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No promotions recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {history?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.student_name ?? '—'}</TableCell>
                  <TableCell>{record.from_school_class_name ?? '—'}</TableCell>
                  <TableCell>{record.to_school_class_name ?? 'Completed'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.action}</Badge>
                  </TableCell>
                  <TableCell>{record.mode}</TableCell>
                  <TableCell>{record.promoted_at.slice(0, 10)}</TableCell>
                  <TableCell>{record.promoted_by_name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
