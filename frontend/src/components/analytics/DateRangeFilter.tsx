import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DateRangeKey } from '@/types/analytics'

const OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'term', label: 'This Term' },
  { key: 'year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

export function DateRangeFilter({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomChange,
}: {
  value: DateRangeKey
  onChange: (range: DateRangeKey) => void
  customFrom: string
  customTo: string
  onCustomChange: (from: string, to: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            size="sm"
            variant="ghost"
            onClick={() => onChange(opt.key)}
            className={cn(
              'h-7 rounded-md px-2.5 text-xs',
              value === opt.key && 'bg-background shadow-sm hover:bg-background'
            )}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {value === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomChange(e.target.value, customTo)}
            className="border-input h-7 rounded-md border bg-transparent px-2 text-xs shadow-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomChange(customFrom, e.target.value)}
            className="border-input h-7 rounded-md border bg-transparent px-2 text-xs shadow-xs"
          />
        </div>
      )}
    </div>
  )
}
