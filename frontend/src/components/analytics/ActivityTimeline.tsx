import { ClipboardList, FileBarChart, Receipt } from 'lucide-react'
import type { ActivityItem } from '@/types/analytics'

const TYPE_ICON = { admission: ClipboardList, payment: Receipt, exam: FileBarChart }
const TYPE_COLOR = {
  admission: 'bg-[var(--chart-2)]/15 text-[var(--chart-2)]',
  payment: 'bg-[var(--chart-3)]/15 text-[var(--chart-3)]',
  exam: 'bg-[var(--chart-4)]/15 text-[var(--chart-4)]',
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const Icon = TYPE_ICON[item.type]
        return (
          <div key={i} className="flex items-start gap-3 rounded-lg px-1 py-2 hover:bg-muted/50">
            <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[item.type]}`}>
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{item.text}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(item.at)}</span>
          </div>
        )
      })}
    </div>
  )
}
