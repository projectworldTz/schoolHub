import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LayoutGrid, LogOut, School } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/layout/Logo'
import { NavigationButtons } from '@/components/layout/NavigationButtons'
import { RefreshButton } from '@/components/layout/RefreshButton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { PlatformMobileNav } from '@/components/layout/PlatformMobileNav'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/platform/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/platform/schools', label: 'Schools', icon: School },
]

export function PlatformLayout() {
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()
  const navigate = useNavigate()

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        toast.success('Signed out')
        navigate('/login')
      },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <PlatformMobileNav links={NAV_LINKS} />
            <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
            <Badge variant="secondary" className="hidden rounded-full md:inline-flex">
              Platform Admin
            </Badge>
            <nav className="ml-2 hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                    )
                  }
                >
                  <link.icon className="size-4" />
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <NavigationButtons />
            <RefreshButton />
            <ThemeToggle />
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Avatar className="size-7">
                <AvatarFallback className="bg-gradient-brand text-xs text-white">
                  {user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate text-sm font-medium xl:inline">{user?.name}</span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sign out" className="rounded-full" onClick={handleLogout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="app-content mx-auto min-w-0 max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
