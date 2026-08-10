import { useMemo } from 'react'
import { useGradingSystems } from '@/hooks/useAcademics'
import { cn } from '@/lib/utils'

/**
 * Ordered best-to-worst (index 0 = highest band) and mapped onto grade
 * bands proportionally, so the top band is always green and the bottom
 * band is always dark red regardless of how many bands a school defines
 * (grade_bands is already sorted by min_score desc — see
 * GradingSystem::gradeBands() on the backend).
 */
const COLOR_STOPS = [
  'border-green-600/30 bg-green-500/15 text-green-800 dark:text-green-400',
  'border-lime-600/30 bg-lime-500/15 text-lime-800 dark:text-lime-400',
  'border-amber-600/30 bg-amber-500/15 text-amber-800 dark:text-amber-400',
  'border-orange-600/30 bg-orange-500/15 text-orange-800 dark:text-orange-400',
  'border-red-600/30 bg-red-500/15 text-red-800 dark:text-red-400',
  'border-red-900/50 bg-red-900/15 text-red-900 dark:text-red-500',
]

function colorForPosition(index: number, total: number): string {
  if (total <= 1) return COLOR_STOPS[0]
  const stopIndex = Math.round((index / (total - 1)) * (COLOR_STOPS.length - 1))
  return COLOR_STOPS[stopIndex]
}

/**
 * Tallies however many grades are passed in against the school's default
 * grading system's bands — works for a single subject's results or a whole
 * class's overall exam grades, since both already carry a `grade` string
 * matching a band label. Renders nothing until there's at least one graded
 * entry, so it doesn't show an empty shell before marks exist.
 */
export function GradeDistribution({ grades, title = 'Result summary' }: { grades: (string | null | undefined)[]; title?: string }) {
  const { data: gradingSystems } = useGradingSystems.useList()
  const gradingSystem = gradingSystems?.find((g) => g.is_default) ?? gradingSystems?.[0]

  const counts = useMemo(() => {
    const tally: Record<string, number> = {}
    for (const grade of grades) {
      if (!grade) continue
      tally[grade] = (tally[grade] ?? 0) + 1
    }
    return tally
  }, [grades])

  const bands = gradingSystem?.grade_bands ?? []
  const gradedCount = grades.filter(Boolean).length

  if (bands.length === 0 || gradedCount === 0) return null

  return (
    <div className="space-y-2">
      {title && <p className="text-sm font-medium">{title}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {bands.map((band, index) => (
          <div
            key={band.id}
            className={cn(
              'flex items-center justify-between gap-2 rounded-lg border px-3 py-2',
              colorForPosition(index, bands.length)
            )}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold">{band.label}</p>
              {band.remark && <p className="truncate text-xs opacity-80">{band.remark}</p>}
            </div>
            <p className="text-lg font-bold tabular-nums">{counts[band.label] ?? 0}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
