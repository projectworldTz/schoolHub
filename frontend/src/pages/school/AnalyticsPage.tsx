import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  Treemap,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BookOpen,
  Building2,
  CalendarCheck,
  FileBarChart,
  GraduationCap,
  Receipt,
  Users,
  Wallet,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KpiCard } from '@/components/analytics/KpiCard'
import { RadialGauge } from '@/components/analytics/RadialGauge'
import { CalendarHeatmap } from '@/components/analytics/CalendarHeatmap'
import { RankingList } from '@/components/analytics/RankingList'
import { ActivityTimeline } from '@/components/analytics/ActivityTimeline'
import { DateRangeFilter } from '@/components/analytics/DateRangeFilter'
import {
  useAcademicsReport,
  useAttendanceReport,
  useBranchComparison,
  useBudgetReport,
  useEnrollmentReport,
  useFinanceReport,
  useOverviewReport,
  useStaffAttendanceReport,
} from '@/hooks/useAnalytics'
import { useExams } from '@/hooks/useExams'
import type { DateRangeKey } from '@/types/analytics'

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}
const tooltipStyle = { borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)', fontSize: 12 }

const KPI_ICONS: Record<string, typeof GraduationCap> = {
  students: GraduationCap,
  teachers: Users,
  classes: Building2,
  revenue: Wallet,
  subjects: BookOpen,
  exams: FileBarChart,
  attendance_today: CalendarCheck,
  fee_collection: Receipt,
}

function ChartCard({
  title,
  description,
  className,
  contentClassName,
  children,
}: {
  title: string
  description?: string
  className?: string
  contentClassName?: string
  children: React.ReactNode
}) {
  return (
    <Card className={`border-none shadow-sm ${className ?? ''}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={contentClassName ?? 'h-72'}>{children}</CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function useRangeState(initial: DateRangeKey = 'month') {
  const [range, setRange] = useState<DateRangeKey>(initial)
  const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))

  return { range, setRange, from, to, setFrom, setTo }
}

function OverviewTab() {
  const { range, setRange, from, to, setFrom, setTo } = useRangeState('month')
  const params = range === 'custom' ? { range, from, to } : { range }
  const { data, isLoading } = useOverviewReport(params)

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} customFrom={from} customTo={to} onCustomChange={(f, t) => { setFrom(f); setTo(t) }} />

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.kpis.map((kpi) => (
              <KpiCard key={kpi.key} kpi={kpi} icon={KPI_ICONS[kpi.key] ?? FileBarChart} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Admissions funnel" description="Applications by pipeline stage" contentClassName="h-96">
              {data.admissions_funnel.every((s) => s.count === 0) ? (
                <EmptyState text="No admissions recorded yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart margin={{ top: 8, right: 90, bottom: 8, left: 8 }}>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Funnel dataKey="count" data={data.admissions_funnel} nameKey="stage" isAnimationActive={false}>
                      <LabelList
                        position="right"
                        dataKey="stage"
                        fill="var(--foreground)"
                        stroke="none"
                        fontSize={12}
                      />
                      {data.admissions_funnel.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Recent activity" description="Latest admissions, payments & exams" contentClassName="h-96">
              <div className="h-full overflow-y-auto">
                <ActivityTimeline items={data.activity} />
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}

function EnrollmentTab() {
  const { data, isLoading } = useEnrollmentReport()

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Active Students</p>
            <p className="font-display mt-1 text-2xl font-semibold">{data?.total_active ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Gender distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.by_gender ?? []}
                dataKey="count"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                startAngle={0}
                endAngle={359.999}
                paddingAngle={2}
                label
              >
                {(data?.by_gender ?? []).map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enrollment by class" description="Active students per class">
          <RankingList
            rows={(data?.by_class ?? []).map((c) => ({ label: c.label, value: c.count }))}
            color="var(--chart-2)"
          />
        </ChartCard>
      </div>

      {(data?.by_year.length ?? 0) > 1 && (
        <ChartCard title="Enrollment by academic year">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.by_year}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}

function AttendanceTab() {
  const { range, setRange, from, to, setFrom, setTo } = useRangeState('month')
  const params = range === 'custom' ? { range, from, to } : { range }
  const { data, isLoading } = useAttendanceReport(params)
  const { data: staffData, isLoading: staffLoading } = useStaffAttendanceReport(params)

  return (
    <div className="space-y-4">
      <DateRangeFilter value={range} onChange={setRange} customFrom={from} customTo={to} onCustomChange={(f, t) => { setFrom(f); setTo(t) }} />

      <p className="text-sm font-semibold text-muted-foreground">Students</p>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Overall rate</CardTitle>
              </CardHeader>
              <CardContent>
                <RadialGauge value={data.overall_rate} label="attendance" color="var(--chart-3)" />
              </CardContent>
            </Card>

            <ChartCard title="Status breakdown" className="lg:col-span-2">
              {data.status_breakdown.every((s) => s.count === 0) ? (
                <EmptyState text="No attendance recorded for this range." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.status_breakdown}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={90}
                      startAngle={0}
                      endAngle={359.999}
                      paddingAngle={2}
                      label
                    >
                      {data.status_breakdown.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Daily attendance</CardTitle>
              <CardDescription>Rate per school day over the selected range</CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarHeatmap data={data.daily_trend.map((d) => ({ date: d.date, value: d.rate }))} />
            </CardContent>
          </Card>

          <ChartCard title="Attendance by class" description="Present + late as a share of total marks">
            <RankingList
              rows={data.by_class.map((c) => ({ label: c.label, value: c.rate, displayValue: `${c.rate}%`, maxValue: 100 }))}
              color="var(--chart-3)"
            />
          </ChartCard>
        </>
      )}

      <p className="pt-2 text-sm font-semibold text-muted-foreground">Staff</p>

      {staffLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!staffLoading && staffData && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Staff attendance rate</CardTitle>
            </CardHeader>
            <CardContent>
              <RadialGauge value={staffData.overall_rate} label="present" color="var(--chart-1)" />
            </CardContent>
          </Card>

          <ChartCard title="Staff status breakdown" className="lg:col-span-2">
            {staffData.status_breakdown.every((s) => s.count === 0) ? (
              <EmptyState text="No staff attendance recorded for this range." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={staffData.status_breakdown}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={90}
                    startAngle={0}
                    endAngle={359.999}
                    paddingAngle={2}
                    label
                  >
                    {staffData.status_breakdown.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  )
}

function AcademicsTab() {
  const { data: exams } = useExams()
  const [examId, setExamId] = useState<string | undefined>(undefined)
  const { data, isLoading } = useAcademicsReport(examId)

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Exam</p>
          <Select value={examId ?? data?.exam_id ?? undefined} onValueChange={setExamId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Best-covered exam" />
            </SelectTrigger>
            <SelectContent>
              {exams?.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && !data?.exam_id && <p className="text-sm text-muted-foreground">No exams recorded yet.</p>}
      {!isLoading && data?.exam_id && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Pass rate</CardTitle>
              </CardHeader>
              <CardContent>
                <RadialGauge value={data.pass_rate} label="passed" color="var(--chart-1)" />
              </CardContent>
            </Card>

            <ChartCard title="Grade distribution" className="lg:col-span-2">
              {data.grade_distribution.length === 0 ? (
                <EmptyState text="No graded results yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.grade_distribution}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={90}
                      startAngle={0}
                      endAngle={359.999}
                      paddingAngle={2}
                      label
                    >
                      {data.grade_distribution.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Subject strength by class" description="Average score % — radar compares classes at a glance">
              {data.radar.length === 0 ? (
                <EmptyState text="No subject data for this exam." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.radar} outerRadius="75%">
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="subject" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={10} tickCount={5} />
                    {data.radar_series.map((series, index) => (
                      <Radar
                        key={series}
                        name={series}
                        dataKey={series}
                        stroke={CHART_COLORS[index % CHART_COLORS.length]}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                        fillOpacity={0.25}
                      />
                    ))}
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Average score trend" description="Across every exam recorded this year">
              {data.exam_trend.length < 2 ? (
                <EmptyState text="Need at least two exams to show a trend." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.exam_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="exam_name" tickLine={false} axisLine={false} fontSize={11} />
                    <YAxis unit="%" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="average_percentage" stroke="var(--chart-4)" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}

function TreemapContent(props: unknown) {
  const { x, y, width, height, name, index } = props as {
    x: number; y: number; width: number; height: number; name: string; index: number
  }
  if (width < 2 || height < 2) return <g />
  const color = CHART_COLORS[index % CHART_COLORS.length]

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} fillOpacity={0.85} stroke="var(--card)" strokeWidth={2} rx={4} />
      {width > 60 && height > 30 && (
        <text x={x + 8} y={y + 20} fill="#fff" fontSize={12} fontWeight={600}>
          {name}
        </text>
      )}
    </g>
  )
}

const BUDGET_STATUS_COLOR: Record<string, string> = {
  over: 'var(--chart-5)',
  near: 'var(--chart-4)',
  under: 'var(--chart-3)',
}
const BUDGET_STATUS_LABEL: Record<string, string> = {
  over: 'Over budget',
  near: 'Near limit',
  under: 'Under budget',
}

function FinanceTab() {
  const { data, isLoading } = useFinanceReport()
  const { data: budget, isLoading: budgetLoading } = useBudgetReport()

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!data) return null

  const cashFlowData = data.cash_flow.map((c) => ({ month: c.month, In: c.in, Out: c.out }))
  const treemapData = data.expenses_by_category.map((e) => ({ name: e.label, size: Number(e.total) }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total billed</p>
            <p className="font-display mt-1 text-xl font-semibold">{data.total_billed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total collected</p>
            <p className="font-display mt-1 text-xl font-semibold">{data.total_collected.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
            <p className="font-display mt-1 text-xl font-semibold">{data.total_outstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Collection rate</p>
              <p className="font-display mt-1 text-xl font-semibold">{data.collection_rate ?? 0}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Cash flow" description="Collected vs. spent (expenses + payroll) per month">
          {cashFlowData.length === 0 ? (
            <EmptyState text="No financial activity recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={44} tickFormatter={compactNumber} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="In" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.25} />
                <Area type="monotone" dataKey="Out" stroke="var(--chart-5)" fill="var(--chart-5)" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Payment status" description="Every invoice, by current status">
          {data.payment_status_breakdown.length === 0 ? (
            <EmptyState text="No invoices yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.payment_status_breakdown}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={90}
                  startAngle={0}
                  endAngle={359.999}
                  paddingAngle={2}
                  label
                >
                  {data.payment_status_breakdown.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Expenses by category" description="Sized by total spend">
          {treemapData.length === 0 ? (
            <EmptyState text="No expenses recorded yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <Treemap data={treemapData} dataKey="size" content={TreemapContent} isAnimationActive={false} />
            </ResponsiveContainer>
          )}
        </ChartCard>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent payments</CardTitle>
          </CardHeader>
          <CardContent className="h-72 overflow-y-auto">
            {data.recent_payments.length === 0 ? (
              <EmptyState text="No payments recorded yet." />
            ) : (
              <div className="space-y-1">
                {data.recent_payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg px-1 py-2 hover:bg-muted/50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.student_name ?? 'Unknown student'}</p>
                      <p className="text-xs text-muted-foreground">{p.paid_at} · {p.method.replace('_', ' ')}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold">{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Fee collection by class</CardTitle>
          <CardDescription>Billed vs. collected, with collection rate</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Billed</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead className="w-48">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.fee_collection_by_class.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No fee data yet.
                  </TableCell>
                </TableRow>
              )}
              {data.fee_collection_by_class.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell>{row.billed.toLocaleString()}</TableCell>
                  <TableCell>{row.collected.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-[var(--chart-3)]"
                          style={{ width: `${Math.min(100, row.rate)}%` }}
                        />
                      </div>
                      <Badge variant={row.rate >= 80 ? 'secondary' : row.rate >= 50 ? 'outline' : 'destructive'}>
                        {row.rate}%
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Budget vs. actual</CardTitle>
          <CardDescription>
            {budget
              ? `Budgeted ${budget.total_budgeted.toLocaleString()} · Spent ${budget.total_actual.toLocaleString()} this academic year`
              : 'By expense category, for the current academic year'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {budgetLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!budgetLoading && (!budget || budget.lines.length === 0) && (
            <EmptyState text="No budgets set for this academic year yet." />
          )}
          {!budgetLoading && budget && budget.lines.length > 0 && (
            <div className="space-y-4">
              {budget.lines.map((line) => (
                <div key={line.budget_id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{line.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {line.actual.toLocaleString()} / {line.budgeted.toLocaleString()}
                      </span>
                      <Badge
                        variant={line.status === 'over' ? 'destructive' : line.status === 'near' ? 'outline' : 'secondary'}
                      >
                        {BUDGET_STATUS_LABEL[line.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, line.utilization_pct ?? 0)}%`,
                        backgroundColor: BUDGET_STATUS_COLOR[line.status],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BranchesTab() {
  const { data, isLoading } = useBranchComparison()

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Branches</CardTitle>
        <CardDescription>Students, staff, attendance, and academics side by side across every campus.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && data?.length === 0 && (
          <EmptyState text="No branches set up yet — add one under School Settings." />
        )}
        {!isLoading && data && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Attendance (30d)</TableHead>
                <TableHead>Academic average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.branch_id}>
                  <TableCell className="font-medium">{row.branch_name}</TableCell>
                  <TableCell>{row.student_count}</TableCell>
                  <TableCell>{row.staff_count}</TableCell>
                  <TableCell>{row.attendance_rate !== null ? `${row.attendance_rate}%` : '—'}</TableCell>
                  <TableCell>{row.academic_average !== null ? `${row.academic_average}%` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Enrollment, attendance, academics, and finance at a glance.</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="enrollment" className="mt-4">
          <EnrollmentTab />
        </TabsContent>
        <TabsContent value="attendance" className="mt-4">
          <AttendanceTab />
        </TabsContent>
        <TabsContent value="academics" className="mt-4">
          <AcademicsTab />
        </TabsContent>
        <TabsContent value="finance" className="mt-4">
          <FinanceTab />
        </TabsContent>
        <TabsContent value="branches" className="mt-4">
          <BranchesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
