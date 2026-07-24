import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AttendanceTrendPoint } from '@/types/attendance'

function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

/**
 * Month-by-month attendance rate as a line graph — the trend view behind
 * "is this student's attendance improving or slipping", not just a single
 * day's register. Shared by the staff student-detail page and the parent
 * portal, both of which get the same {period, rate, present, absent, ...}
 * shape from the backend (AttendanceService::trend()).
 */
export function AttendanceTrendChart({ data }: { data: AttendanceTrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough attendance history yet to show a trend.</p>
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="period" tickFormatter={formatPeriod} tickLine={false} axisLine={false} fontSize={12} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} unit="%" />
          <Tooltip
            cursor={{ stroke: 'var(--border)' }}
            contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)' }}
            labelFormatter={(label) => formatPeriod(String(label))}
            formatter={(value) => [`${value}%`, 'Attendance rate']}
          />
          <Line type="monotone" dataKey="rate" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
