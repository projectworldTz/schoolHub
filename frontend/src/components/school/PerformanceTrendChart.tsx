import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ParentResultGroup } from '@/types/parent'

function tierColor(percentage: number): string {
  if (percentage >= 80) return 'var(--chart-3)'
  if (percentage >= 65) return 'var(--chart-2)'
  if (percentage >= 50) return 'var(--chart-4)'
  return 'var(--chart-5)'
}

/**
 * Bar-per-exam average with a trend line overlaid — bars show the
 * magnitude of each exam's result, the line makes the direction (improving
 * vs slipping) readable across exams at a glance. Only exams with a graded
 * average are plotted; the backend already excludes non-completed exams.
 */
export function PerformanceTrendChart({ results }: { results: ParentResultGroup[] }) {
  const points = [...results]
    .filter((r) => r.average_percentage !== null)
    .sort((a, b) => {
      if (a.exam_date && b.exam_date) return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
      return 0
    })
    .map((r) => ({
      exam_name: r.exam_name,
      exam_date: r.exam_date,
      average_percentage: r.average_percentage as number,
      class_position: r.class_position,
      class_size: r.class_size,
    }))

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough graded exams yet to show a performance trend.</p>
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={points} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis dataKey="exam_name" tickLine={false} axisLine={false} fontSize={12} interval={0} angle={-15} textAnchor="end" height={40} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={36} unit="%" />
          <Tooltip
            cursor={{ fill: 'var(--muted)' }}
            contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)' }}
            formatter={(value, name) => (name === 'average_percentage' ? [`${value}%`, 'Average'] : [value, name])}
            labelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload
              if (point?.class_position) return `${label} · ranked ${point.class_position} of ${point.class_size}`
              return label
            }}
          />
          <Bar dataKey="average_percentage" radius={[6, 6, 0, 0]} barSize={32}>
            {points.map((p, i) => (
              <Cell key={i} fill={tierColor(p.average_percentage)} fillOpacity={0.75} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="average_percentage" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
