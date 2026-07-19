import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { SparklinePoint } from '@/types/analytics'

const TREND_COLOR: Record<string, string> = {
  up: 'var(--chart-3)',
  down: 'var(--chart-5)',
  flat: 'var(--muted-foreground)',
}

export function Sparkline({ data, trend }: { data: SparklinePoint[]; trend: 'up' | 'down' | 'flat' }) {
  const color = TREND_COLOR[trend]

  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={40}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.75}
          fill={`url(#spark-${trend})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
