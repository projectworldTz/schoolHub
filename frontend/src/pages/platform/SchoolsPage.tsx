import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSchools } from '@/hooks/useSchools'
import { CreateSchoolDialog } from './CreateSchoolDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function SchoolsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useSchools({ page })
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Schools</h1><p className="text-sm text-muted-foreground">Select a school to manage its details, website, AI Assistant, and fee features.</p></div><CreateSchoolDialog /></div>
      <div className="rounded-lg border bg-background"><Table>
        <TableHeader><TableRow><TableHead>School</TableHead><TableHead>Owner</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Students</TableHead><TableHead>Teachers</TableHead><TableHead>Parents</TableHead><TableHead /></TableRow></TableHeader>
        <TableBody>
          {isLoading && <TableRow><TableCell colSpan={8}>Loading schools...</TableCell></TableRow>}
          {isError && <TableRow><TableCell colSpan={8} className="text-destructive">Could not load schools.</TableCell></TableRow>}
          {data?.data.length === 0 && <TableRow><TableCell colSpan={8}>No schools registered yet.</TableCell></TableRow>}
          {data?.data.map((school) => <TableRow key={school.id}>
            <TableCell><Link className="font-medium hover:underline" to={`/platform/schools/${school.id}`}>{school.name}</Link><p className="text-xs text-muted-foreground">{school.city}</p></TableCell>
            <TableCell>{school.owner?.name ?? '—'}<p className="text-xs text-muted-foreground">{school.owner?.email}</p></TableCell>
            <TableCell className="capitalize">{school.type}</TableCell><TableCell><Badge variant={school.status === 'suspended' ? 'destructive' : 'outline'}>{school.status}</Badge></TableCell>
            <TableCell>{school.students_count ?? '—'}</TableCell><TableCell>{school.teachers_count ?? '—'}</TableCell><TableCell>{school.parents_count ?? '—'}</TableCell>
            <TableCell><Button asChild variant="outline" size="sm"><Link to={`/platform/schools/${school.id}`} aria-label={`Manage ${school.name}`}>Manage school</Link></Button></TableCell>
          </TableRow>)}
        </TableBody>
      </Table></div>
      {data && <div className="flex flex-wrap items-center justify-end gap-3"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm">Page {page} of {data.meta.last_page}</span><Button variant="outline" disabled={page >= data.meta.last_page} onClick={() => setPage(page + 1)}>Next</Button></div>}
    </div>
  )
}
