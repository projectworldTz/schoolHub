import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'
import { QUICK_ACTIONS } from '@/config/quickActions'
import { cn } from '@/lib/utils'

export function QuickAddMenu({ floating = false }: { floating?: boolean }) {
  const { data: user } = useCurrentUser()
  const navigate = useNavigate()

  const actions = QUICK_ACTIONS.filter((a) => hasPermission(user, a.permission))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {floating ? (
          <Button
            size="icon"
            className="bg-gradient-brand fixed right-6 bottom-6 z-40 size-14 rounded-full text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105"
          >
            <Plus className="size-6" />
            <span className="sr-only">Quick add</span>
          </Button>
        ) : (
          <Button size="icon" variant="ghost" className="rounded-full">
            <Plus className="size-4" />
            <span className="sr-only">Quick add</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick add</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.comingSoon}
            onClick={() => !action.comingSoon && navigate(action.to)}
            className={cn('gap-2', action.comingSoon && 'opacity-50')}
          >
            <action.icon className="size-4" />
            <span className="flex-1">{action.label}</span>
            {action.comingSoon && <span className="text-[10px] text-muted-foreground">Soon</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
