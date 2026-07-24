import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  UsersRound,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlatformDashboard } from '@/hooks/useSchools'
import type { SchoolStatus } from '@/types/school'
import type { LucideIcon } from 'lucide-react'

const STATUS_VARIANT: Record<SchoolStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  suspended: 'destructive',
  rejected: 'outline',
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'default',
}: {
  label: string
  value: number
  icon: LucideIcon
  tone?: 'default' | 'warning' | 'danger'
}) {
  const toneClasses =
    tone === 'warning'
      ? 'text-yellow-700 dark:text-yellow-400'
      : tone === 'danger'
        ? 'text-destructive'
        : 'text-foreground'

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex items-center gap-3 p-5">
        <span className="bg-gradient-brand flex size-10 shrink-0 items-center justify-center rounded-xl text-white">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`font-display text-2xl font-semibold ${toneClasses}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const ACTION_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  created: 'default',
  updated: 'secondary',
  deleted: 'destructive',
}

export function PlatformDashboardPage() {
  const { data, isLoading } = usePlatformDashboard()
  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Every school on SchoolHub Africa, at a glance — registrations, active users, and activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Schools" value={stats?.schools_total ?? 0} icon={Building2} />
        <StatTile label="Total users" value={stats?.users_total ?? 0} icon={UsersRound} />
        <StatTile label="Pending approval" value={stats?.schools_pending ?? 0} icon={Clock} tone="warning" />
        <StatTile label="Suspended" value={stats?.schools_suspended ?? 0} icon={ShieldAlert} tone="danger" />
        <StatTile label="Approved & active" value={stats?.schools_approved ?? 0} icon={CheckCircle2} />
        <StatTile
          label="Licenses expiring soon"
          value={stats?.licenses_expiring_soon ?? 0}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatTile label="Licenses expired" value={stats?.licenses_expired ?? 0} icon={AlertTriangle} tone="danger" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recently registered schools</CardTitle>
            <CardDescription>The 8 newest schools on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && data?.recent_schools.length === 0 && (
              <p className="text-sm text-muted-foreground">No schools registered yet.</p>
            )}
            {data?.recent_schools.map((school) => (
              <Link
                key={school.id}
                to="/platform/schools"
                className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{school.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {school.type} · {school.users_count} user{school.users_count === 1 ? '' : 's'} ·{' '}
                    {new Date(school.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[school.status]}>{school.status}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" /> Recent activity
            </CardTitle>
            <CardDescription>What's happening across every school, newest first.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-3 overflow-y-auto">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && data?.recent_activity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
            {data?.recent_activity.map((entry) => (
              <div key={entry.id} className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm">
                <div>
                  <p>{entry.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {entry.school_name} · {entry.user_name} · {timeAgo(entry.created_at)}
                  </p>
                </div>
                <Badge variant={ACTION_VARIANT[entry.action] ?? 'secondary'} className="shrink-0">
                  {entry.action}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
