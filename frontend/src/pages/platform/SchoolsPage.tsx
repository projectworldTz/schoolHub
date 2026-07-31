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
import { GraduationCap, MoreHorizontal, UserRound, UsersRound } from 'lucide-react'
import { CreateSchoolDialog } from '@/pages/platform/CreateSchoolDialog'
import { SuspendSchoolDialog } from '@/pages/platform/SuspendSchoolDialog'
import { RenewLicenseDialog } from '@/pages/platform/RenewLicenseDialog'
import { CustomDomainDialog } from '@/pages/platform/CustomDomainDialog'
import { EditSchoolDialog } from '@/pages/platform/EditSchoolDialog'
import { licenseStatus, type LicenseTier } from '@/lib/license'

const STATUS_VARIANT: Record<School['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  suspended: 'destructive',
  rejected: 'outline',
}

const LICENSE_VARIANT: Record<LicenseTier, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ok: 'outline',
  warning: 'secondary',
  danger: 'destructive',
  expired: 'destructive',
}

function LicenseBadge({ expiresAt }: { expiresAt: string | null }) {
  const status = licenseStatus(expiresAt)
  if (!status) return <span className="text-muted-foreground">—</span>

  const label =
    status.tier === 'expired'
      ? `Expired ${Math.abs(status.daysRemaining)}d ago`
      : `${status.daysRemaining}d left`

  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant={LICENSE_VARIANT[status.tier]}>{label}</Badge>
      <span className="text-xs text-muted-foreground">{new Date(expiresAt!).toLocaleDateString()}</span>
    </div>
  )
}

export function SchoolsPage() {
  const { data, isLoading, isError } = useSchools()
  const approveSchool = useApproveSchool()
  const [suspendTarget, setSuspendTarget] = useState<School | null>(null)
  const [renewTarget, setRenewTarget] = useState<School | null>(null)
  const [domainTarget, setDomainTarget] = useState<School | null>(null)
  const [editTarget, setEditTarget] = useState<School | null>(null)

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
              <TableHead>Users</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Teachers</TableHead>
              <TableHead>Parents</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>License</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  Loading schools…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-destructive">
                  Could not load schools.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  No schools registered yet.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{school.name}</span>
                    {school.custom_domain && (
                      <span className="text-xs font-normal text-muted-foreground">{school.custom_domain}</span>
                    )}
                  </div>
                </TableCell>
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
                  <div className="flex items-center gap-1.5">
                    <UsersRound className="size-3.5 text-muted-foreground" />
                    {school.users_count ?? '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="size-3.5 text-muted-foreground" />
                    {school.students_count ?? '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3.5 text-muted-foreground" />
                    {school.teachers_count ?? '—'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <UserRound className="size-3.5 text-muted-foreground" />
                    {school.parents_count ?? '—'}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(school.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <LicenseBadge expiresAt={school.license_expires_at} />
                </TableCell>
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
                      <DropdownMenuItem onClick={() => setEditTarget(school)}>
                        Edit school
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRenewTarget(school)}>
                        Renew license
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDomainTarget(school)}>
                        {school.custom_domain ? 'Edit custom domain' : 'Set custom domain'}
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

      {editTarget && (
        <EditSchoolDialog
          school={editTarget}
          open={Boolean(editTarget)}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}

      {suspendTarget && (
        <SuspendSchoolDialog
          schoolId={suspendTarget.id}
          schoolName={suspendTarget.name}
          open={Boolean(suspendTarget)}
          onOpenChange={(open) => !open && setSuspendTarget(null)}
        />
      )}

      {renewTarget && (
        <RenewLicenseDialog
          schoolId={renewTarget.id}
          schoolName={renewTarget.name}
          open={Boolean(renewTarget)}
          onOpenChange={(open) => !open && setRenewTarget(null)}
        />
      )}

      {domainTarget && (
        <CustomDomainDialog
          schoolId={domainTarget.id}
          schoolName={domainTarget.name}
          currentDomain={domainTarget.custom_domain}
          open={Boolean(domainTarget)}
          onOpenChange={(open) => !open && setDomainTarget(null)}
        />
      )}
    </div>
  )
}
