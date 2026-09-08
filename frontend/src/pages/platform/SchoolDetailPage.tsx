import { SchoolFeatureCards } from './SchoolFeatureCards'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import {
  useApproveSchool,
  useEnterSchool,
  useReactivateSchoolAiAccess,
  useReactivateSchoolWebsiteAccess,
  useRevokeSchoolAiAccess,
  useRevokeSchoolWebsiteAccess,
  useSchool,
} from '@/hooks/useSchools'
import type { AiAccessStatus, School, WebsiteAccessStatus } from '@/types/school'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { SuspendSchoolDialog } from '@/pages/platform/SuspendSchoolDialog'
import { RenewLicenseDialog } from '@/pages/platform/RenewLicenseDialog'
import { CustomDomainDialog } from '@/pages/platform/CustomDomainDialog'
import { EditSchoolDialog } from '@/pages/platform/EditSchoolDialog'
import { GrantAiAccessDialog } from '@/pages/platform/GrantAiAccessDialog'
import { SuspendAiAccessDialog } from '@/pages/platform/SuspendAiAccessDialog'
import { GrantWebsiteAccessDialog } from '@/pages/platform/GrantWebsiteAccessDialog'
import { SuspendWebsiteAccessDialog } from '@/pages/platform/SuspendWebsiteAccessDialog'
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

const AI_ACCESS_VARIANT: Record<AiAccessStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  not_granted: 'outline',
  active: 'default',
  suspended: 'destructive',
  expired: 'destructive',
}

const AI_ACCESS_LABEL: Record<AiAccessStatus, string> = {
  not_granted: 'Not granted',
  active: 'Active',
  suspended: 'Suspended',
  expired: 'Expired',
}

const WEBSITE_ACCESS_VARIANT: Record<WebsiteAccessStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  not_granted: 'outline',
  active: 'default',
  suspended: 'destructive',
  expired: 'destructive',
}

const WEBSITE_ACCESS_LABEL: Record<WebsiteAccessStatus, string> = {
  not_granted: 'Not granted',
  active: 'Active',
  suspended: 'Suspended',
  expired: 'Expired',
}

function AiAccessBadge({ school }: { school: School }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant={AI_ACCESS_VARIANT[school.ai_access_status]}>{AI_ACCESS_LABEL[school.ai_access_status]}</Badge>
      {school.ai_access_status === 'active' && (
        <span className="text-xs text-muted-foreground">
          {school.ai_requests_this_month}
          {school.ai_monthly_request_limit != null ? ` / ${school.ai_monthly_request_limit}` : ''} this month
        </span>
      )}
    </div>
  )
}

function WebsiteAccessBadge({ school }: { school: School }) {
  return (
    <Badge variant={WEBSITE_ACCESS_VARIANT[school.website_access_status]}>
      {WEBSITE_ACCESS_LABEL[school.website_access_status]}
    </Badge>
  )
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

export function SchoolDetailPage() {
  const { id = '' } = useParams()
  const { data: school, isLoading, isError } = useSchool(id)
  const approveSchool = useApproveSchool()
  const enterSchool = useEnterSchool()
  const reactivateAiAccess = useReactivateSchoolAiAccess()
  const revokeAiAccess = useRevokeSchoolAiAccess()
  const reactivateWebsiteAccess = useReactivateSchoolWebsiteAccess()
  const revokeWebsiteAccess = useRevokeSchoolWebsiteAccess()
  const navigate = useNavigate()
  const [suspendTarget, setSuspendTarget] = useState<School | null>(null)
  const [renewTarget, setRenewTarget] = useState<School | null>(null)
  const [domainTarget, setDomainTarget] = useState<School | null>(null)
  const [editTarget, setEditTarget] = useState<School | null>(null)
  const [grantAiTarget, setGrantAiTarget] = useState<School | null>(null)
  const [suspendAiTarget, setSuspendAiTarget] = useState<School | null>(null)
  const [grantWebsiteTarget, setGrantWebsiteTarget] = useState<School | null>(null)
  const [suspendWebsiteTarget, setSuspendWebsiteTarget] = useState<School | null>(null)

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

  function handleReactivateAiAccess(school: School) {
    reactivateAiAccess.mutate(school.id, {
      onSuccess: () => toast.success(`AI Assistant access reactivated for ${school.name}`),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not reactivate AI access')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  function handleEnterSchool(school: School) {
    enterSchool.mutate(school.id, {
      onSuccess: () => {
        toast.success(`Now viewing ${school.name} with full access`)
        navigate('/app/dashboard')
      },
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not enter school')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  function handleRevokeAiAccess(school: School) {
    revokeAiAccess.mutate(school.id, {
      onSuccess: () => toast.success(`AI Assistant access revoked for ${school.name}`),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not revoke AI access')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  function handleReactivateWebsiteAccess(school: School) {
    reactivateWebsiteAccess.mutate(school.id, {
      onSuccess: () => toast.success(`Website Builder access reactivated for ${school.name}`),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not reactivate Website Builder access')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  function handleRevokeWebsiteAccess(school: School) {
    revokeWebsiteAccess.mutate(school.id, {
      onSuccess: () => toast.success(`Website Builder access revoked for ${school.name}`),
      onError: (error) => {
        const message = isAxiosError(error)
          ? (error.response?.data?.message ?? 'Could not revoke Website Builder access')
          : 'Something went wrong'
        toast.error(message)
      },
    })
  }

  if (isLoading) return <p>Loading school...</p>
  if (isError || !school) return <p className="text-destructive">Could not load this school. <Link to="/platform/schools">Back to schools</Link></p>
  return (
    <div className="space-y-6">
      <Link to="/platform/schools" className="text-sm text-muted-foreground hover:underline">Back to schools</Link>
      <div><h1 className="text-2xl font-semibold">{school.name}</h1><p className="text-sm text-muted-foreground">Manage this school’s details and feature access.</p></div>
      <Card><CardHeader><CardTitle>School details</CardTitle><CardDescription>{school.owner?.name} | {school.owner?.email}</CardDescription></CardHeader><CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4"><Badge variant={STATUS_VARIANT[school.status]}>{school.status}</Badge><span className="capitalize">{school.type}</span><span>{school.city}</span><LicenseBadge expiresAt={school.license_expires_at} /></div>
        <div className="flex flex-wrap gap-2">                      <Button variant="outline" disabled={enterSchool.isPending} onClick={() => handleEnterSchool(school)}>
                        View as Owner
                      </Button>
                      <Button variant="outline"
                        disabled={school.status === 'approved' || approveSchool.isPending}
                        onClick={() => handleApprove(school)}
                      >
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => setEditTarget(school)}>
                        Edit school
                      </Button>
                      <Button variant="outline" onClick={() => setRenewTarget(school)}>
                        Renew license
                      </Button>
                      <Button variant="outline" onClick={() => setDomainTarget(school)}>
                        {school.custom_domain ? 'Edit custom domain' : 'Set custom domain'}
                      </Button>
                      <Button variant="outline"
                        disabled={school.status === 'suspended'}
                        onClick={() => setSuspendTarget(school)}
                        className="text-destructive"
                      >
                        Suspend
                      </Button>
</div>
      </CardContent></Card>
      <h2 className="text-xl font-semibold">Features</h2>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <SchoolFeatureCards key={school.id} school={school} />
        <Card><CardHeader><CardTitle>AI Assistant</CardTitle><CardDescription>Access, expiry, and monthly request allowance.</CardDescription></CardHeader><CardContent className="space-y-4"><AiAccessBadge school={school} />
          {school.ai_expires_at && <p className="text-sm">Expires {new Date(school.ai_expires_at).toLocaleDateString()}</p>}
          <div className="flex flex-wrap gap-2">                      <Button variant="outline" onClick={() => setGrantAiTarget(school)}>
                        {school.ai_access_status === 'not_granted' ? 'Grant AI access' : 'Adjust AI access'}
                      </Button>
                      {school.ai_access_status === 'suspended' ? (
                        <Button variant="outline" disabled={reactivateAiAccess.isPending} onClick={() => handleReactivateAiAccess(school)}>
                          Reactivate AI access
                        </Button>
                      ) : (
                        <Button variant="outline"
                          disabled={school.ai_access_status !== 'active'}
                          onClick={() => setSuspendAiTarget(school)}
                        >
                          Suspend AI access
                        </Button>
                      )}
                      {school.ai_access_status !== 'not_granted' && (
                        <Button variant="outline"
                          onClick={() => handleRevokeAiAccess(school)}
                          className="text-destructive"
                        >
                          Revoke AI access
                        </Button>
                      )}
</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Public Website</CardTitle><CardDescription>Website Builder access.</CardDescription></CardHeader><CardContent className="space-y-4"><WebsiteAccessBadge school={school} />
          {school.custom_domain && <p className="break-all text-sm">{school.custom_domain}</p>}
          {school.website_expires_at && <p className="text-sm">Expires {new Date(school.website_expires_at).toLocaleDateString()}</p>}
          <div className="flex flex-wrap gap-2">                      <Button variant="outline" onClick={() => setGrantWebsiteTarget(school)}>
                        {school.website_access_status === 'not_granted' ? 'Grant Website access' : 'Adjust Website access'}
                      </Button>
                      {school.website_access_status === 'suspended' ? (
                        <Button variant="outline" disabled={reactivateWebsiteAccess.isPending} onClick={() => handleReactivateWebsiteAccess(school)}>
                          Reactivate Website access
                        </Button>
                      ) : (
                        <Button variant="outline"
                          disabled={school.website_access_status !== 'active'}
                          onClick={() => setSuspendWebsiteTarget(school)}
                        >
                          Suspend Website access
                        </Button>
                      )}
                      {school.website_access_status !== 'not_granted' && (
                        <Button variant="outline"
                          onClick={() => handleRevokeWebsiteAccess(school)}
                          className="text-destructive"
                        >
                          Revoke Website access
                        </Button>
                      )}
</div>
        </CardContent></Card>
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

      {grantAiTarget && (
        <GrantAiAccessDialog
          school={grantAiTarget}
          open={Boolean(grantAiTarget)}
          onOpenChange={(open) => !open && setGrantAiTarget(null)}
        />
      )}

      {suspendAiTarget && (
        <SuspendAiAccessDialog
          schoolId={suspendAiTarget.id}
          schoolName={suspendAiTarget.name}
          open={Boolean(suspendAiTarget)}
          onOpenChange={(open) => !open && setSuspendAiTarget(null)}
        />
      )}

      {grantWebsiteTarget && (
        <GrantWebsiteAccessDialog
          school={grantWebsiteTarget}
          open={Boolean(grantWebsiteTarget)}
          onOpenChange={(open) => !open && setGrantWebsiteTarget(null)}
        />
      )}

      {suspendWebsiteTarget && (
        <SuspendWebsiteAccessDialog
          schoolId={suspendWebsiteTarget.id}
          schoolName={suspendWebsiteTarget.name}
          open={Boolean(suspendWebsiteTarget)}
          onOpenChange={(open) => !open && setSuspendWebsiteTarget(null)}
        />
      )}
    </div>
  )
}
