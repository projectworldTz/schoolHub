import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts'

export function RadialGauge({
  value,
  label,
  color = 'var(--chart-1)',
}: {
  value: number | null
  label: string
  color?: string
}) {
  const safeValue = value ?? 0
  const data = [{ name: label, value: safeValue, fill: color }]

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <RadialBarChart
          data={data}
          startAngle={90}
          endAngle={-270}
          innerRadius="70%"
          outerRadius="100%"
          barSize={14}
        >
          <RadialBar dataKey="value" background={{ fill: 'var(--muted)' }} cornerRadius={8} max={100} isAnimationActive={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold">{value !== null ? `${value}%` : '—'}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
