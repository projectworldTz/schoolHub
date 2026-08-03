import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Coins,
  FileBarChart,
  GraduationCap,
  Info,
  Megaphone,
  Minus,
  NotebookPen,
  Receipt,
  Table2,
  TrendingDown,
  TrendingUp,
  UserPlus,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/useAuth'
import { useSchoolProfile, useHolidays } from '@/hooks/useSchoolSetup'
import { useAdmissions } from '@/hooks/useAdmissions'
import { useHomeworks } from '@/hooks/useHomework'
import { useLeaveRequests } from '@/hooks/useStaff'
import { useInvoices } from '@/hooks/useFinance'
import { useExams } from '@/hooks/useExams'
import { useAcademicsReport, useEnrollmentReport, useOverviewReport } from '@/hooks/useAnalytics'
import { hasPermission } from '@/lib/permissions'
import { licenseStatus } from '@/lib/license'
import { cn } from '@/lib/utils'
import { AiAccessIndicator } from '@/pages/school/AiAccessIndicator'
import { formatKpiValue } from '@/components/analytics/KpiCard'
import type { Kpi } from '@/types/analytics'
import type { LucideIcon } from 'lucide-react'

type PeriodKey = 'month' | 'term' | 'year'
const PERIOD_LABEL: Record<PeriodKey, string> = { month: 'This Month', term: 'This Term', year: 'This Year' }
const PREV_PERIOD_LABEL: Record<PeriodKey, string> = { month: 'vs last month', term: 'vs last term', year: 'vs last year' }

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']
const tooltipStyle = { borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)', fontSize: 12 }

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

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Consistent fade-up entrance, staggered by index. */
function fadeUp(index: number, stepMs = 60) {
  return {
    className: 'animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards duration-700 ease-out',
    style: { animationDelay: `${index * stepMs}ms` },
  }
}

function periodRange(period: PeriodKey): { from: string; to: string } {
  const now = new Date()
  const toStr = now.toISOString().slice(0, 10)
  if (period === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: toStr }
  }
  if (period === 'term') {
    const from = new Date(now)
    from.setDate(from.getDate() - 90)
    return { from: from.toISOString().slice(0, 10), to: toStr }
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  return { from: from.toISOString().slice(0, 10), to: toStr }
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

const STAT_ACCENTS = ['--chart-1', '--chart-2', '--chart-4', '--chart-3'] as const

function StatTile({
  kpi,
  icon: Icon,
  accent,
  periodLabel,
  index,
}: {
  kpi: Kpi
  icon: LucideIcon
  accent: (typeof STAT_ACCENTS)[number]
  periodLabel: string
  index: number
}) {
  const accentVar = `var(${accent})`
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Minus
  const trendClass =
    kpi.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : kpi.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
  const { className: fadeClass, style: fadeStyle } = fadeUp(index)

  return (
    <Card className={cn('border-none shadow-sm', fadeClass)} style={fadeStyle}>
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
          <p className="font-display mt-1.5 text-2xl font-semibold tabular-nums">{formatKpiValue(kpi.value, kpi.format)}</p>
          {kpi.delta_pct !== null && (
            <div className={cn('mt-1.5 flex items-center gap-1 text-xs font-medium', trendClass)}>
              <TrendIcon className="size-3" />
              <span>
                {kpi.delta_pct > 0 ? '+' : ''}
                {kpi.delta_pct}%
              </span>
              <span className="font-normal text-muted-foreground">{periodLabel}</span>
            </div>
          )}
        </div>
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: accentVar }}
        >
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  )
}

interface QuickLink {
  label: string
  to: string
  icon: LucideIcon
  permission?: string | string[]
}

export function DashboardPage() {
  const { data: user } = useCurrentUser()
  const { data: school } = useSchoolProfile()
  const [period, setPeriod] = useState<PeriodKey>('month')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const canStudents = hasPermission(user, 'students.manage')
  const canStaff = hasPermission(user, 'staff.manage')
  const canAdmissions = hasPermission(user, 'admissions.manage')
  const canHomework = hasPermission(user, 'homework.manage')
  const canSettings = hasPermission(user, 'school-settings.manage')
  const canFinance = hasPermission(user, 'finance.manage')
  const canAnalytics = hasPermission(user, 'analytics.view')
  const canExams = hasPermission(user, ['exams.manage', 'exam-marks.record'])

  const { from, to } = periodRange(period)
  const { data: overview } = useOverviewReport({ range: period, from, to })
  const { data: enrollment } = useEnrollmentReport()
  const { data: academics } = useAcademicsReport()
  const { data: exams } = useExams()
  const { data: admissions } = useAdmissions('')
  const { data: homeworks } = useHomeworks()
  const { data: leaveRequests } = useLeaveRequests()
  const { data: invoices } = useInvoices({ per_page: 100 })
  const { data: holidays } = useHolidays.useList()

  const kpiByKey = new Map((overview?.kpis ?? []).map((k) => [k.key, k]))

  const inSevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000
  const homeworkDueSoon = (homeworks ?? []).filter(
    (h) => new Date(h.due_date).getTime() <= inSevenDays && new Date(h.due_date).getTime() >= Date.now()
  )
  const pendingAdmissions = (admissions?.data ?? []).filter((a) => a.status === 'pending' || a.status === 'under_review')
  const pendingLeave = (leaveRequests?.data ?? []).filter((l) => l.status === 'pending')
  const awaitingPaymentInvoices = (invoices?.data ?? []).filter((i) => i.status === 'unpaid' || i.status === 'partial' || i.status === 'overdue')

  const upcomingExams = [...(exams ?? [])]
    .filter((e) => e.start_date && new Date(e.start_date).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
    .slice(0, 4)

  const todaysEvents = (holidays ?? [])
    .filter((h) => new Date(h.start_date).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 4)

  const quickLinks: QuickLink[] = [
    { label: 'Add New Student', to: '/app/students?new=student', icon: UserPlus, permission: 'students.manage' },
    { label: 'Collect Fee', to: '/app/finance', icon: Receipt, permission: 'finance.manage' },
    { label: 'Take Attendance', to: '/app/attendance', icon: CalendarCheck, permission: 'attendance.manage' },
    { label: 'Create Notice', to: '/app/communication?new=announcement', icon: Megaphone, permission: 'announcements.manage' },
    { label: 'Generate Report Card', to: '/app/exams', icon: GraduationCap, permission: ['exams.manage', 'exam-marks.record'] },
    { label: 'Class Timetable', to: '/app/timetable', icon: Table2, permission: 'timetable.manage' },
  ].filter((l) => hasPermission(user, l.permission))

  const pendingTasks = [
    canAdmissions && { label: `Review ${pendingAdmissions.length} pending admission${pendingAdmissions.length === 1 ? '' : 's'}`, count: pendingAdmissions.length, to: '/app/admissions', icon: ClipboardList },
    canStaff && { label: `Approve ${pendingLeave.length} leave request${pendingLeave.length === 1 ? '' : 's'}`, count: pendingLeave.length, to: '/app/staff', icon: Coins },
    canHomework && { label: `${homeworkDueSoon.length} homework assignment${homeworkDueSoon.length === 1 ? '' : 's'} due this week`, count: homeworkDueSoon.length, to: '/app/homework', icon: NotebookPen },
    canFinance && { label: `${awaitingPaymentInvoices.length} invoice${awaitingPaymentInvoices.length === 1 ? '' : 's'} awaiting payment`, count: awaitingPaymentInvoices.length, to: '/app/finance', icon: Receipt },
  ].filter((t): t is { label: string; count: number; to: string; icon: LucideIcon } => Boolean(t))

  const isOwner = user?.roles?.includes('School Owner') ?? false
  const license = licenseStatus(school?.license_expires_at ?? null)
  const showLicenseBanner = isOwner && license && license.tier !== 'ok'

  const revenueKpi = kpiByKey.get('revenue')
  const currency = school?.currency ?? ''

  return (
    <div className="space-y-6">
      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-3', fadeUp(0).className)} style={fadeUp(0).style}>
        <Card
          className="bg-gradient-brand relative overflow-hidden border-none text-white shadow-lg shadow-primary/25 lg:col-span-2"
        >
          <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="animate-sheen pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
          <CardContent className="relative flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-medium tracking-widest text-white/70 uppercase">
                {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <p className="font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {greeting()}, {user?.name?.split(' ')[0]} 👋
              </p>
              <p className="mt-1.5 text-sm text-white/80">{school?.name}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 font-medium backdrop-blur-sm">
                {user?.roles?.[0] ?? 'Member'}
              </span>
              {school && (
                <AiAccessIndicator
                  status={school.ai_access_status}
                  expiresAt={school.ai_expires_at}
                  suspensionReason={school.ai_suspension_reason}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="flex h-full flex-col justify-center gap-1 p-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Today is</span>
            </div>
            <p className="font-display text-lg font-semibold">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm text-muted-foreground">
              {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {showLicenseBanner && license && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 text-sm',
            license.tier === 'warning' && 'border-yellow-600/30 bg-yellow-500/10 text-yellow-800 dark:text-yellow-400',
            (license.tier === 'danger' || license.tier === 'expired') && 'border-destructive/30 bg-destructive/10 text-destructive'
          )}
        >
          {license.tier === 'warning' ? <Info className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
          <div>
            {license.tier === 'warning' && (
              <p>
                Your school's license expires in <span className="font-medium">{license.daysRemaining} days</span> (on{' '}
                {new Date(school!.license_expires_at!).toLocaleDateString()}). Please arrange a renewal with your account manager ahead of time.
              </p>
            )}
            {license.tier === 'danger' && (
              <p className="font-medium">
                Urgent: your school's license expires in {license.daysRemaining} day{license.daysRemaining === 1 ? '' : 's'} (on{' '}
                {new Date(school!.license_expires_at!).toLocaleDateString()}). Renew now to avoid a service interruption.
              </p>
            )}
            {license.tier === 'expired' && (
              <p className="font-medium">
                Your school's license expired {Math.abs(license.daysRemaining)} day{Math.abs(license.daysRemaining) === 1 ? '' : 's'} ago. Contact your
                account manager immediately to restore full access.
              </p>
            )}
          </div>
        </div>
      )}

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-4', fadeUp(1).className)} style={fadeUp(1).style}>
        <Card className="border-none shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
              >
                <link.icon className="size-4 text-muted-foreground" />
                <span className="flex-1">{link.label}</span>
                <ArrowUpRight className="size-3.5 text-muted-foreground" />
              </Link>
            ))}
            {quickLinks.length === 0 && <EmptyState icon={ClipboardList} text="No quick actions available for your role." />}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
          {canStudents && kpiByKey.get('students') && (
            <StatTile kpi={kpiByKey.get('students')!} icon={UsersRound} accent="--chart-1" periodLabel={PREV_PERIOD_LABEL[period]} index={2} />
          )}
          {canStaff && kpiByKey.get('teachers') && (
            <StatTile kpi={{ ...kpiByKey.get('teachers')!, label: 'Teachers' }} icon={GraduationCap} accent="--chart-2" periodLabel={PREV_PERIOD_LABEL[period]} index={3} />
          )}
          {canFinance && revenueKpi && (
            <StatTile kpi={{ ...revenueKpi, label: 'Fee Collection' }} icon={Wallet} accent="--chart-4" periodLabel={PREV_PERIOD_LABEL[period]} index={4} />
          )}
          {kpiByKey.get('attendance_today') && (
            <StatTile kpi={{ ...kpiByKey.get('attendance_today')!, label: 'Attendance' }} icon={CalendarCheck} accent="--chart-3" periodLabel="vs same day last period" index={5} />
          )}
        </div>
      </div>

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-3', fadeUp(6).className)} style={fadeUp(6).style}>
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Fee Collection Overview</CardTitle>
              <CardDescription>Daily amount collected, {PERIOD_LABEL[period].toLowerCase()}</CardDescription>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="term">This Term</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="h-72">
            {canFinance && revenueKpi && revenueKpi.sparkline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueKpi.sparkline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="feeCollectionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    formatter={(value) => [`${currency} ${Number(value ?? 0).toLocaleString()}`, 'Collected']}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--chart-1)" strokeWidth={2} fill="url(#feeCollectionFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Wallet} text="No fee collection recorded for this period yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Students by Class</CardTitle>
            <CardDescription>{enrollment?.total_active ?? 0} active students</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {canStudents && (enrollment?.by_class.length ?? 0) > 0 ? (
              <div className="flex h-full flex-col">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={enrollment?.by_class ?? []}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={45}
                        outerRadius={65}
                        startAngle={0}
                        endAngle={359.999}
                        paddingAngle={2}
                      >
                        {(enrollment?.by_class ?? []).map((_, index) => (
                          <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto">
                  {(enrollment?.by_class ?? []).map((c, i) => (
                    <div key={c.label} className="flex items-center gap-2 text-xs">
                      <span className="size-2 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="flex-1 truncate text-muted-foreground">{c.label}</span>
                      <span className="font-medium tabular-nums">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={UsersRound} text="No active enrollment yet." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-3', fadeUp(7).className)} style={fadeUp(7).style}>
        <Card className="border-none shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Upcoming Exams</CardTitle>
            {canExams && (
              <Link to="/app/exams" className="text-xs text-primary hover:underline">
                View all
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {!canExams && <EmptyState icon={FileBarChart} text="You don't have access to examinations." />}
            {canExams && upcomingExams.length === 0 && <EmptyState icon={FileBarChart} text="No upcoming exams scheduled." />}
            {upcomingExams.map((exam) => {
              const daysLeft = exam.start_date ? Math.ceil((new Date(exam.start_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null
              return (
                <div key={exam.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center leading-none">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {exam.start_date ? new Date(exam.start_date).toLocaleDateString(undefined, { month: 'short' }) : '—'}
                    </span>
                    <span className="font-display text-sm font-semibold">
                      {exam.start_date ? new Date(exam.start_date).getDate() : '–'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{exam.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{exam.exam_type}</p>
                  </div>
                  {daysLeft !== null && daysLeft >= 0 && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      {daysLeft === 0 ? 'Today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                    </span>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Top Performing Students</CardTitle>
            {canAnalytics && (
              <Link to="/app/analytics" className="text-xs text-primary hover:underline">
                View all
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-1">
            {(academics?.top_students.length ?? 0) === 0 && <EmptyState icon={GraduationCap} text="No graded exam results yet." />}
            {(academics?.top_students ?? []).map((s, i) => (
              <div key={s.student_id} className="flex items-center gap-3 rounded-lg px-1 py-2">
                <span className="w-4 shrink-0 text-xs font-semibold text-muted-foreground">{i + 1}</span>
                <span className="bg-gradient-brand flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-medium text-white">
                  {initials(s.student_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.student_name}</p>
                  <p className="text-xs text-muted-foreground">{s.class_name}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{s.average_percentage}%</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {pendingTasks.length === 0 && <EmptyState icon={ClipboardList} text="Nothing pending right now." />}
            {pendingTasks.map((task) => (
              <Link
                key={task.label}
                to={task.to}
                className="flex items-center gap-2.5 rounded-lg px-1 py-2 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <task.icon className="size-3.5" />
                </span>
                <span className="flex-1 truncate">{task.label}</span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{task.count}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className={cn('grid grid-cols-1 gap-4 lg:grid-cols-3', fadeUp(8).className)} style={fadeUp(8).style}>
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activities</CardTitle>
            <CardDescription>Admissions, payments, and exams — most recent first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {(overview?.activity.length ?? 0) === 0 && (
              <EmptyState icon={ClipboardList} text="Nothing to show yet — activity will appear here as things happen." />
            )}
            {(overview?.activity ?? []).map((entry, i) => {
              const Icon = entry.type === 'admission' ? UserPlus : entry.type === 'payment' ? Wallet : FileBarChart
              const color = entry.type === 'admission' ? 'var(--chart-1)' : entry.type === 'payment' ? 'var(--chart-3)' : 'var(--chart-5)'
              return (
                <div key={`${entry.type}-${i}`} className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color }}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{entry.text}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(entry.at)}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Today's Events</CardTitle>
            {canSettings && (
              <Link to="/app/academic-setup" className="text-xs text-primary hover:underline">
                Calendar
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysEvents.length === 0 && <EmptyState icon={CalendarDays} text="No events scheduled soon." />}
            {todaysEvents.map((h) => (
              <div key={h.id} className="flex items-center gap-3 rounded-xl border p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: 'var(--chart-2)' }}>
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
          </CardContent>
        </Card>
      </div>

      <footer className="flex flex-col items-center justify-between gap-2 border-t py-4 text-xs text-muted-foreground sm:flex-row">
        <p>© {now.getFullYear()} {school?.name ?? 'SchoolHub'}. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span>Help & Support</span>
          <span>SchoolHub Africa</span>
        </div>
      </footer>
    </div>
  )
}
