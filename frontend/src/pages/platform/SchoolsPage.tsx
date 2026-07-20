import { useState } from 'react'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { useApproveSchool, useSchools } from '@/hooks/useSchools'
import type { School } from '@/types/school'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { CreateSchoolDialog } from '@/pages/platform/CreateSchoolDialog'
import { SuspendSchoolDialog } from '@/pages/platform/SuspendSchoolDialog'

const STATUS_VARIANT: Record<School['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  suspended: 'destructive',
  rejected: 'outline',
}

export function SchoolsPage() {
  const { data, isLoading, isError } = useSchools()
  const approveSchool = useApproveSchool()
  const [suspendTarget, setSuspendTarget] = useState<School | null>(null)

  function handleApprove(school: School) {
    approveSchool.mutate(school.id, {
      onSuccess: () => toast.success(`${school.name} approved`),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not approve school')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schools</h1>
          <p className="text-sm text-muted-foreground">
            Register, approve, and manage every school on the platform.
          </p>
        </div>
        <CreateSchoolDialog />
      </div>

      <div className="rounded-lg border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading schools…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-destructive">
                  Could not load schools.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No schools registered yet.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>
                  {school.owner ? (
                    <div className="flex flex-col">
                      <span>{school.owner.name}</span>
                      <span className="text-muted-foreground text-xs">{school.owner.email}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="capitalize">{school.type}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[school.status]}>{school.status}</Badge>
                </TableCell>
                <TableCell>{school.city ?? '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={school.status === 'approved'}
                        onClick={() => handleApprove(school)}
                      >
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={school.status === 'suspended'}
                        onClick={() => setSuspendTarget(school)}
                        className="text-destructive"
                      >
                        Suspend
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {suspendTarget && (
        <SuspendSchoolDialog
          schoolId={suspendTarget.id}
          schoolName={suspendTarget.name}
          open={Boolean(suspendTarget)}
          onOpenChange={(open) => !open && setSuspendTarget(null)}
        />
      )}
    </div>
  )
}
