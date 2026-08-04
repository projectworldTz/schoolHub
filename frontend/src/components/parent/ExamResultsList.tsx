import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ParentResultGroup } from '@/types/parent'

export function ExamResultsList({ results, loading }: { results: ParentResultGroup[] | undefined; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!loading && results?.length === 0 && <p className="text-sm text-muted-foreground">No exam results yet.</p>}
        {results?.map((group) => (
          <div key={group.exam_id} className="rounded-lg border p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{group.exam_name}</p>
              <div className="flex items-center gap-2 text-sm">
                {group.overall_grade && <Badge>{group.overall_grade}</Badge>}
                <span className="text-muted-foreground">
                  {group.average_percentage !== null ? `${group.average_percentage}%` : '—'}
                  {group.class_position ? ` · ranked ${group.class_position} of ${group.class_size}` : ''}
                </span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.subjects.map((s) => (
                  <TableRow key={s.subject_name}>
                    <TableCell>{s.subject_name}</TableCell>
                    <TableCell>
                      {s.marks_obtained ?? '—'} / {s.max_marks}
                    </TableCell>
                    <TableCell>{s.grade ? <Badge>{s.grade}</Badge> : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
