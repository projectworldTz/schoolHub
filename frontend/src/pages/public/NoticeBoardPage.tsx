import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useNoticeBoardClasses, useNoticeBoardExams, useNoticeBoardRanking } from '@/hooks/useNoticeBoard'

/**
 * Public, unauthenticated — the digital equivalent of a school pinning the
 * results sheet to a physical notice board. Only exams the school has
 * explicitly marked "Published" (see ExamDetailPage) ever show up here.
 */
export function NoticeBoardPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const [examId, setExamId] = useState('')
  const [classId, setClassId] = useState('')

  const { data: exams, isLoading: examsLoading } = useNoticeBoardExams(slug)
  const { data: classes } = useNoticeBoardClasses(slug, examId)
  const { data: ranking, isLoading: rankingLoading } = useNoticeBoardRanking(slug, examId, classId)

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 bg-background p-4 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="bg-gradient-brand flex size-11 items-center justify-center rounded-xl text-white">
          <ClipboardList className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold">Notice Board</h1>
          <p className="text-sm text-muted-foreground">Published exam results</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check results</CardTitle>
          <CardDescription>Choose an exam, then a class, to see the ranked results sheet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={examId}
              onValueChange={(v) => {
                setExamId(v)
                setClassId('')
              }}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams?.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} ({e.academic_year_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!examsLoading && exams?.length === 0 && (
            <p className="text-sm text-muted-foreground">No results have been published yet — check back later.</p>
          )}

          {examId && !classId && (
            <p className="text-sm text-muted-foreground">Now pick a class.</p>
          )}

          {classId && rankingLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {classId && ranking && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {ranking.exam_name} &middot; {ranking.class_name}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Admission #</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.ranking.map((row) => (
                    <TableRow key={row.admission_number}>
                      <TableCell className="font-semibold text-primary">{row.position}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.admission_number}</TableCell>
                      <TableCell>{row.average_percentage}%</TableCell>
                      <TableCell>{row.grade ? <Badge>{row.grade}</Badge> : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
