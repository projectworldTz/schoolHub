import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="bg-gradient-brand flex size-8 shrink-0 items-center justify-center rounded-xl text-white shadow-sm shadow-primary/30">
        <GraduationCap className="size-4.5" strokeWidth={2.25} />
      </span>
      {!iconOnly && (
        <span className="font-display text-[15px] font-semibold tracking-tight">
          SchoolHub <span className="text-muted-foreground font-medium">Africa</span>
        </span>
      )}
    </div>
  )
}
