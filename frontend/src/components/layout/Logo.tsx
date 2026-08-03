import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({
  className,
  iconOnly = false,
  onDark = false,
}: {
  className?: string
  iconOnly?: boolean
  /** Renders the wordmark in white — for use on the fixed dark-navy chrome, which ignores the light/dark theme. */
  onDark?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="bg-gradient-brand flex size-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm shadow-primary/30">
        <GraduationCap className="size-4.5" strokeWidth={2.25} />
      </span>
      {!iconOnly && (
        <span className={cn('font-display text-[15px] font-semibold tracking-tight', onDark && 'text-white')}>
          SchoolHub{' '}
          <span className={cn('font-medium', onDark ? 'text-white/60' : 'text-muted-foreground')}>Africa</span>
        </span>
      )}
    </div>
  )
}
