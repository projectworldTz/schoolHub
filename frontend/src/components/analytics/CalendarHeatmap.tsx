import { useMemo, useState } from 'react'

interface HeatmapDay {
  date: string
  value: number
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function intensityClass(value: number | null): string {
  if (value === null) return 'bg-muted/40'
  if (value >= 90) return 'bg-[var(--chart-3)]'
  if (value >= 75) return 'bg-[var(--chart-3)]/70'
  if (value >= 60) return 'bg-[var(--chart-3)]/45'
  if (value >= 40) return 'bg-[var(--chart-5)]/45'
  return 'bg-[var(--chart-5)]/75'
}

/** GitHub-contributions-style grid: one cell per day, colored by intensity, grouped into week columns. */
export function CalendarHeatmap({ data, unit = '%' }: { data: HeatmapDay[]; unit?: string }) {
  const [hovered, setHovered] = useState<HeatmapDay | null>(null)

  const weeks = useMemo(() => {
    if (data.length === 0) return []

    const byDate = new Map(data.map((d) => [d.date, d.value]))
    const first = new Date(data[0].date)
    const last = new Date(data[data.length - 1].date)

    // Align to Monday of the first week so columns represent real weeks.
    const start = new Date(first)
    const mondayOffset = (start.getDay() + 6) % 7
    start.setDate(start.getDate() - mondayOffset)

    const cols: { date: string; value: number | null }[][] = []
    let cursor = new Date(start)
    let col: { date: string; value: number | null }[] = []

    while (cursor <= last) {
      const iso = cursor.toISOString().slice(0, 10)
      col.push({ date: iso, value: byDate.has(iso) ? byDate.get(iso)! : null })
      if (col.length === 7) {
        cols.push(col)
        col = []
      }
      cursor = new Date(cursor.getTime() + 86400000)
    }
    if (col.length > 0) {
      while (col.length < 7) col.push({ date: '', value: null })
      cols.push(col)
    }

    return cols
  }, [data])

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data for this range.</p>
  }

  return (
    <div>
      <div className="flex gap-3">
        <div className="flex flex-col justify-between gap-1 pt-4 pb-1">
          {DAY_LABELS.map((d) => (
            <span key={d} className="h-3.5 text-[10px] leading-3.5 text-muted-foreground">
              {d}
            </span>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {weeks.map((col, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {col.map((cell, di) => (
                <div
                  key={di}
                  className={`size-3.5 rounded-sm ${cell.date ? intensityClass(cell.value) : 'opacity-0'}`}
                  onMouseEnter={() => cell.date && setHovered({ date: cell.date, value: cell.value ?? 0 })}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 h-4 text-xs text-muted-foreground">
        {hovered ? `${hovered.date}: ${hovered.value}${unit}` : 'Hover a day for its rate'}
      </p>
    </div>
  )
}
