import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { InvoiceStatus } from '@/types/finance'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: 'border-green-600/30 bg-green-500/15 text-green-800 dark:text-green-400',
  partial: 'border-amber-600/30 bg-amber-500/15 text-amber-800 dark:text-amber-400',
  unpaid: 'border-red-600/30 bg-red-500/15 text-red-800 dark:text-red-400',
  overdue: 'border-transparent bg-red-600 text-white dark:bg-red-700',
  cancelled: 'border-border bg-muted text-muted-foreground',
}

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  )
}
