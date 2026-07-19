import type { LucideIcon } from 'lucide-react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Sparkline } from './Sparkline'
import type { Kpi } from '@/types/analytics'

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }
const TREND_TEXT_CLASS = {
  up: 'text-emerald-600 dark:text-emerald-400',
  down: 'text-red-600 dark:text-red-400',
  flat: 'text-muted-foreground',
}

function formatValue(value: number, format: Kpi['format']): string {
  if (format === 'currency') {
    return value >= 1_000_000
      ? `${(value / 1_000_000).toFixed(1)}M`
      : value.toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
  if (format === 'percent') return `${value}%`
  return value.toLocaleString()
}

export function KpiCard({ icon: Icon, kpi }: { icon: LucideIcon; kpi: Kpi }) {
  const TrendIcon = TREND_ICON[kpi.trend]

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
            <p className="font-display mt-1 text-2xl font-semibold">{formatValue(kpi.value, kpi.format)}</p>
          </div>
          <span className="bg-gradient-brand flex size-9 shrink-0 items-center justify-center rounded-lg text-white">
            <Icon className="size-4" />
          </span>
        </div>

        {kpi.delta_pct !== null && (
          <div className={cn('mt-1 flex items-center gap-1 text-xs font-medium', TREND_TEXT_CLASS[kpi.trend])}>
            <TrendIcon className="size-3" />
            <span>
              {kpi.delta_pct > 0 ? '+' : ''}
              {kpi.delta_pct}%
            </span>
            <span className="font-normal text-muted-foreground">vs last period</span>
          </div>
        )}

        <div className="mt-2 -mx-1">
          <Sparkline data={kpi.sparkline} trend={kpi.trend} />
        </div>
      </CardContent>
    </Card>
  )
}
