import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  Megaphone,
  NotebookPen,
  Receipt,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCurrentUser } from '@/hooks/useAuth'
import { useSchoolProfile, useHolidays } from '@/hooks/useSchoolSetup'
import { useStudents } from '@/hooks/useStudents'
import { useStaffList } from '@/hooks/useStaff'
import { useAdmissions } from '@/hooks/useAdmissions'
import { useHomeworks } from '@/hooks/useHomework'
import { useAnnouncements } from '@/hooks/useCommunication'
import { useInvoices } from '@/hooks/useFinance'
import { hasPermission } from '@/lib/permissions'
import { MODULE_CARDS } from '@/config/nav'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  enrolled: 'Enrolled',
}

/** One chart color per stat card so the KPI row reads at a glance instead of blurring into one brand-purple wash. */
const STAT_ACCENTS = ['--chart-1', '--chart-2', '--chart-4', '--chart-3', '--chart-5'] as const

/** Consistent fade-up entrance, staggered by index — the dashboard settles into place instead of popping in all at once. */
function fadeUp(index: number, stepMs = 60) {
  return {
    className: 'animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-700 ease-out',
    style: { animationDelay: `${index * stepMs}ms` },
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  hint,
  accent,
  index,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  to: string
  hint?: string
  accent: (typeof STAT_ACCENTS)[number]
  index: number
}) {
  const accentVar = `var(${accent})`
  const { className: fadeClass, style: fadeStyle } = fadeUp(index)
  return (
    <Link to={to} className={cn('block', fadeClass)} style={fadeStyle}>
      <Card
        className="card-hover shadow-premium group relative h-full overflow-hidden border-none bg-card"
        style={{ boxShadow: `inset 0 0 0 1px color-mix(in oklch, ${accentVar} 14%, transparent)` }}
      >
        <div
          className="absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.14]"
          style={{ background: `linear-gradient(135deg, ${accentVar} 0%, transparent 75%)` }}
        />
        <span className="absolute inset-x-0 top-0 h-1" style={{ background: accentVar }} />
        <CardContent className="relative flex items-start justify-between p-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
            <p className="font-display mt-1.5 text-3xl font-semibold tabular-nums">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <span className="relative shrink-0">
            <span
              className="absolute inset-0 -m-1.5 rounded-full opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-70"
              style={{ background: accentVar }}
              aria-hidden
            />
            <span
              className="relative flex size-11 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-105"
              style={{ background: accentVar, boxShadow: `0 10px 24px -8px color-mix(in oklch, ${accentVar} 70%, transparent)` }}
            >
              <Icon className="size-5" />
            </span>
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}

interface ActivityEntry {
  id: string
  icon: LucideIcon
  text: string
  meta: string
  createdAt: string
}

export function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: school } = useSchoolProfile()

  const canStudents = hasPermission(user, 'students.manage')
  const canStaff = hasPermission(user, 'staff.manage')
  const canAdmissions = hasPermission(user, 'admissions.manage')
  const canHomework = hasPermission(user, 'homework.manage')
  const canAnnouncements = hasPermission(user, 'announcements.manage')
  const canSettings = hasPermission(user, 'school-settings.manage')
  const canFinance = hasPermission(user, 'finance.manage')

  const { data: students } = useStudents('')
  const { data: staff } = useStaffList('')
  const { data: admissions } = useAdmissions('')
  const { data: homeworks } = useHomeworks()
  const { data: announcements } = useAnnouncements.useList()
  const { data: holidays } = useHolidays.useList()
  const { data: invoices } = useInvoices({ per_page: 100 })

  const outstandingBalance = (invoices?.data ?? []).reduce((sum, inv) => sum + Number(inv.balance), 0)

  const inSevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000
  const homeworkDueSoon = (homeworks ?? []).filter((h) => new Date(h.due_date).getTime() <= inSevenDays && new Date(h.due_date).getTime() >= Date.now())

  const admissionsByStatus = ['pending', 'under_review', 'accepted', 'rejected', 'enrolled'].map((status) => ({
    status: STATUS_LABEL[status],
    count: (admissions?.data ?? []).filter((a) => a.status === status).length,
  }))

  const upcomingHolidays = (holidays ?? [])
    .filter((h) => new Date(h.start_date).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 4)

  const recentAnnouncements = [...(announcements ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  const activity: ActivityEntry[] = [
    ...(canAdmissions ? admissions?.data ?? [] : []).slice(0, 5).map((a) => ({
      id: `adm-${a.id}`,
      icon: ClipboardList,
      text: `${a.applicant_first_name} ${a.applicant_last_name} applied for ${a.applying_for_class_name ?? 'a class'}`,
      meta: STATUS_LABEL[a.status],
      createdAt: a.created_at,
    })),
    ...(canHomework ? homeworks ?? [] : []).slice(0, 5).map((h) => ({
      id: `hw-${h.id}`,
      icon: NotebookPen,
      text: `Homework "${h.title}" assigned to ${h.school_class_name}`,
      meta: h.subject_name ?? '',
      createdAt: h.created_at,
    })),
    ...(canAnnouncements ? announcements ?? [] : []).slice(0, 5).map((a) => ({
      id: `ann-${a.id}`,
      icon: Megaphone,
      text: `Announcement posted: "${a.title}"`,
      meta: a.audience === 'school' ? 'Whole school' : a.audience,
      createdAt: a.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const visibleModules = MODULE_CARDS.filter((m) => hasPermission(user, m.permission))

  return (
    <div className="space-y-6">
      <Card
        className={cn('bg-gradient-brand relative overflow-hidden border-none text-white shadow-lg shadow-primary/25', fadeUp(0).className)}
        style={fadeUp(0).style}
      >
        <div
          className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 size-64 rounded-full bg-white/10 blur-3xl"
          aria-hidden
        />
        <div
          className="animate-sheen pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          aria-hidden
        />
        <CardContent className="relative flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium tracking-widest text-white/70 uppercase">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p className="font-display mt-1 text-3xl font-semibold tracking-tight">
              {greeting()}, {user?.name?.split(' ')[0]}
            </p>
            <p className="mt-1.5 text-sm text-white/80">{school?.name}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 font-medium backdrop-blur-sm">
              {user?.roles?.[0] ?? 'Member'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {canStudents && (
          <StatCard
            label="Students"
            value={students?.meta.total ?? 0}
            icon={UsersRound}
            to="/app/students"
            accent="--chart-1"
            index={1}
          />
        )}
        {canStaff && (
          <StatCard
            label="Staff"
            value={staff?.meta.total ?? 0}
            icon={ClipboardList}
            to="/app/staff"
            accent="--chart-2"
            index={2}
          />
        )}
        {canAdmissions && (
          <StatCard
            label="Pending admissions"
            value={(admissions?.data ?? []).filter((a) => a.status === 'pending' || a.status === 'under_review').length}
            icon={FileBarChart}
            to="/app/admissions"
            accent="--chart-4"
            index={3}
          />
        )}
        {canHomework && (
          <StatCard
            label="Homework due this week"
            value={homeworkDueSoon.length}
            icon={NotebookPen}
            to="/app/homework"
            accent="--chart-3"
            index={4}
          />
        )}
        {canFinance && (
          <StatCard
            label="Fees outstanding"
            value={outstandingBalance.toLocaleString()}
            icon={Receipt}
            to="/app/finance"
            accent="--chart-5"
            index={5}
          />
        )}
      </div>

      <div className={fadeUp(6).className} style={fadeUp(6).style}>
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-gradient-brand h-4 w-1 rounded-full" aria-hidden />
          <h2 className="font-display text-base font-semibold">Modules</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleModules.map((mod, i) => {
            const accentVar = `var(${STAT_ACCENTS[i % STAT_ACCENTS.length]})`
            return (
              <Link key={mod.label} to={mod.comingSoon ? '#' : mod.to} onClick={(e) => mod.comingSoon && e.preventDefault()}>
                <Card
                  className={cn(
                    'card-hover shadow-premium group relative h-full overflow-hidden border-none bg-card',
                    mod.comingSoon && 'cursor-default opacity-60'
                  )}
                >
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-[0.06]"
                    style={{ background: `linear-gradient(135deg, ${accentVar} 0%, transparent 75%)` }}
                  />
                  <CardContent className="relative flex flex-col gap-3 p-4">
                    <div className="flex items-start justify-between">
                      <span className="relative">
                        <span
                          className="absolute inset-0 -m-1 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-50"
                          style={{ background: accentVar }}
                          aria-hidden
                        />
                        <span
                          className="relative flex size-10 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-105"
                          style={{ background: accentVar, boxShadow: `0 8px 18px -6px color-mix(in oklch, ${accentVar} 65%, transparent)` }}
                        >
                          <mod.icon className="size-5" />
                        </span>
                      </span>
                      {!mod.comingSoon && (
                        <ArrowUpRight className="size-4 -translate-x-1 translate-y-1 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100" />
                      )}
                    </div>
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {mod.label}
                        {mod.comingSoon && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                            Soon
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{mod.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-3', fadeUp(7).className)} style={fadeUp(7).style}>
        <Card className="shadow-premium border-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Admissions pipeline</CardTitle>
            <CardDescription>Applications by status</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {canAdmissions ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionsByStatus}>
                  <defs>
                    <linearGradient id="admissionsBarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                  <Tooltip
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)' }}
                  />
                  <Bar dataKey="count" fill="url(#admissionsBarFill)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={ClipboardList} text="You don't have access to admissions data." />
            )}
          </CardContent>
        </Card>

        <Card className="shadow-premium border-none">
          <CardHeader>
            <CardTitle>Upcoming</CardTitle>
            <CardDescription>Holidays & calendar events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingHolidays.length === 0 && <EmptyState icon={CalendarDays} text="No upcoming holidays scheduled." />}
            {upcomingHolidays.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: 'var(--chart-3)' }}
                >
                  <CalendarDays className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
            {canSettings && (
              <Link to="/app/academic-setup" className="flex items-center gap-1 text-xs text-primary hover:underline">
                Manage academic calendar <ArrowUpRight className="size-3" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-3', fadeUp(8).className)} style={fadeUp(8).style}>
        <Card className="shadow-premium border-none lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Across admissions, homework, and announcements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {activity.length === 0 && <EmptyState icon={Sparkles} text="Nothing to show yet — activity will appear here as things happen." />}
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ background: 'var(--chart-2)' }}
                >
                  <entry.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{entry.text}</p>
                  <p className="text-xs text-muted-foreground">{entry.meta}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-premium border-none">
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
            <CardDescription>Latest posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!canAnnouncements && <EmptyState icon={Megaphone} text="You don't have access to announcements." />}
            {canAnnouncements && recentAnnouncements.length === 0 && (
              <EmptyState icon={Megaphone} text="No announcements posted yet." />
            )}
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="rounded-xl border p-3 transition-colors hover:bg-muted/40">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{a.title}</p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {a.audience}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
              </div>
            ))}
            {canAnnouncements && (
              <Link to="/app/communication" className="flex items-center gap-1 text-xs text-primary hover:underline">
                View all announcements <ArrowUpRight className="size-3" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="max-w-56 text-xs text-muted-foreground">{text}</p>
    </div>
  )
}

