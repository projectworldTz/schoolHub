import { Link } from 'react-router-dom'
import type { NavLink } from '@/config/nav'
import { cn } from '@/lib/utils'

export function MegaMenuContent({ links }: { links: NavLink[] }) {
  return (
    <div className="grid w-[560px] grid-cols-2 gap-1 p-3">
      {links.map((link) => (
        <Link
          key={link.label}
          to={link.comingSoon ? '#' : link.to}
          onClick={(e) => link.comingSoon && e.preventDefault()}
          className={cn(
            'group flex items-start gap-3 rounded-xl p-3 transition-colors',
            link.comingSoon ? 'cursor-default opacity-60' : 'hover:bg-accent/10'
          )}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-brand text-white transition-transform',
              !link.comingSoon && 'group-hover:scale-105'
            )}
          >
            <link.icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              {link.label}
              {link.comingSoon && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                  Soon
                </span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{link.description}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
