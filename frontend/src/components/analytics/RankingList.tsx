export interface RankingRow {
  label: string
  value: number
  displayValue?: string
  maxValue?: number
}

/** Ranked rows with an inline progress bar — for "top N by metric" lists instead of another bar chart. */
export function RankingList({ rows, color = 'var(--chart-1)' }: { rows: RankingRow[]; color?: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  const max = Math.max(...rows.map((r) => r.maxValue ?? r.value), 1)

  return (
    <div className="space-y-3">
      {rows.map((row, i) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-5 shrink-0 text-xs font-semibold text-muted-foreground">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{row.label}</span>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                {row.displayValue ?? row.value}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (row.value / max) * 100)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
