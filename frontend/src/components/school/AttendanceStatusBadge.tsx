import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { AttendanceStatus } from '@/types/attendance'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'border-green-600/30 bg-green-500/15 text-green-800 dark:text-green-400',
  late: 'border-amber-600/30 bg-amber-500/15 text-amber-800 dark:text-amber-400',
  absent: 'border-red-600/30 bg-red-500/15 text-red-800 dark:text-red-400',
  excused: 'border-blue-600/30 bg-blue-500/15 text-blue-800 dark:text-blue-400',
}

export function AttendanceStatusBadge({ status, className }: { status: AttendanceStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn('capitalize', STATUS_STYLES[status], className)}>
      {status}
    </Badge>
  )
}
