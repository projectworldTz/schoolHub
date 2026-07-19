export type KpiFormat = 'number' | 'currency' | 'percent'
export type Trend = 'up' | 'down' | 'flat'

export interface SparklinePoint {
  date: string
  value: number
}

export interface Kpi {
  key: string
  label: string
  format: KpiFormat
  value: number
  delta_pct: number | null
  trend: Trend
  sparkline: SparklinePoint[]
}

export interface FunnelStage {
  stage: string
  count: number
}

export interface ActivityItem {
  type: 'admission' | 'payment' | 'exam'
  text: string
  at: string
}

export interface OverviewReport {
  range: { from: string; to: string }
  kpis: Kpi[]
  admissions_funnel: FunnelStage[]
  activity: ActivityItem[]
}

export interface LabelCount {
  label: string
  count: number
}

export interface EnrollmentReport {
  total_active: number
  by_class: LabelCount[]
  by_gender: LabelCount[]
  by_year: LabelCount[]
  funnel: FunnelStage[]
}

export interface ClassAttendanceRate {
  label: string
  rate: number
  total: number
}

export interface DailyAttendanceRate {
  date: string
  rate: number
}

export interface AttendanceReport {
  from: string
  to: string
  overall_rate: number | null
  by_class: ClassAttendanceRate[]
  daily_trend: DailyAttendanceRate[]
  status_breakdown: LabelCount[]
}

export interface SubjectAverage {
  label: string
  average_percentage: number
}

export interface RadarPoint {
  subject: string
  [className: string]: string | number
}

export interface ExamTrendPoint {
  exam_name: string
  average_percentage: number
}

export interface AcademicsReport {
  exam_id: string | null
  by_subject: SubjectAverage[]
  grade_distribution: LabelCount[]
  pass_rate: number | null
  radar: RadarPoint[]
  radar_series: string[]
  exam_trend: ExamTrendPoint[]
}

export interface LabelTotal {
  label: string
  total: string
}

export interface MonthTotal {
  month: string
  total: string
}

export interface CashFlowPoint {
  month: string
  in: number
  out: number
}

export interface FeeCollectionByClass {
  label: string
  billed: number
  collected: number
  rate: number
}

export interface RecentPayment {
  id: string
  student_name: string | null
  amount: number
  method: string
  paid_at: string | null
}

export interface FinanceReport {
  total_billed: number
  total_collected: number
  total_outstanding: number
  collection_rate: number | null
  expenses_by_category: LabelTotal[]
  revenue_trend: MonthTotal[]
  expense_trend: MonthTotal[]
  payroll_cost_trend: MonthTotal[]
  cash_flow: CashFlowPoint[]
  payment_status_breakdown: LabelCount[]
  fee_collection_by_class: FeeCollectionByClass[]
  recent_payments: RecentPayment[]
}

export type DateRangeKey = 'today' | 'week' | 'month' | 'term' | 'year' | 'custom'

export type BudgetStatus = 'over' | 'near' | 'under'

export interface BudgetLine {
  budget_id: string
  category: string
  budgeted: number
  actual: number
  variance: number
  utilization_pct: number | null
  status: BudgetStatus
}

export interface BudgetReport {
  academic_year_id: string | null
  lines: BudgetLine[]
  total_budgeted: number
  total_actual: number
}

export interface StaffAttendanceReport {
  from: string
  to: string
  overall_rate: number | null
  daily_trend: DailyAttendanceRate[]
  status_breakdown: LabelCount[]
}

export interface BranchComparisonRow {
  branch_id: string
  branch_name: string
  student_count: number
  staff_count: number
  attendance_rate: number | null
  academic_average: number | null
}
