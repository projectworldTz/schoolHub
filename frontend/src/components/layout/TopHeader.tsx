import { useState } from 'react'
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Bell,
  Check,
  ChevronDown,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  UserRound,
} from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Logo } from '@/components/layout/Logo'
import { MobileNav } from '@/components/layout/MobileNav'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { QuickAddMenu } from '@/components/layout/QuickAddMenu'
import { MegaMenuContent } from '@/components/layout/MegaMenuContent'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useSchoolProfile } from '@/hooks/useSchoolSetup'
import { hasPermission } from '@/lib/permissions'
import { NAV_SECTIONS } from '@/config/nav'
import { cn } from '@/lib/utils'

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function EmptyPanel({ icon: Icon, title, description }: { icon: typeof Bell; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

export function TopHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { data: user } = useCurrentUser()
  const { data: school } = useSchoolProfile()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false)

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Signed out')
        navigate('/login')
      },
    })
  }

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.links?.filter((link) => hasPermission(user, link.permission)),
  })).filter((section) => section.to || (section.links && section.links.length > 0))

  return (
    <header className="glass sticky top-0 z-30 border-b">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <MobileNav />
        <Logo className="mr-1 shrink-0" />

        <DropdownMenu open={schoolMenuOpen} onOpenChange={setSchoolMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" className="hidden shrink-0 gap-1.5 rounded-full pl-1.5 2xl:flex">
              <Avatar className="size-5">
                <AvatarFallback className="bg-gradient-brand text-[10px] text-white">
                  {school ? initials(school.name) : '··'}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-32 truncate">{school?.name ?? 'Loading…'}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Your school</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2 opacity-100">
              <Check className="size-4 text-primary" />
              <span className="flex-1 truncate">{school?.name}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              Multi-school switching arrives with the SaaS group plan.
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

        <NavigationMenu viewport={false} className="hidden flex-1 justify-start xl:flex">
          <NavigationMenuList>
            {visibleSections.map((section) =>
              section.to ? (
                <NavigationMenuItem key={section.key}>
                  <NavigationMenuLink asChild>
                    <RouterNavLink
                      to={section.to}
                      className={({ isActive }) =>
                        cn(
                          'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
                          isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
                        )
                      }
                    >
                      <section.icon className="size-4" />
                      {section.label}
                    </RouterNavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={section.key}>
                  <NavigationMenuTrigger className="h-9 rounded-full bg-transparent px-3 text-sm font-medium text-muted-foreground data-[state=open]:text-foreground">
                    <section.icon className="mr-1.5 size-4" />
                    {section.label}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <MegaMenuContent links={section.links ?? []} />
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            )}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="secondary"
            className="hidden w-44 items-center justify-between gap-2 rounded-full text-muted-foreground 2xl:flex"
            onClick={onOpenSearch}
          >
            <span className="flex items-center gap-2 text-sm">
              <Search className="size-4" />
              Search…
            </span>
            <kbd className="rounded-md border bg-background px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full 2xl:hidden" onClick={onOpenSearch}>
            <Search className="size-4" />
          </Button>

          <QuickAddMenu />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Bell className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b px-4 py-3 text-sm font-medium">Notifications</div>
              <EmptyPanel icon={Bell} title="You're all caught up" description="New notifications will show up here." />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden rounded-full lg:flex">
                <MessageSquare className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b px-4 py-3 text-sm font-medium">Messages</div>
              <EmptyPanel icon={MessageSquare} title="No messages yet" description="Direct messaging is coming in a future update." />
            </PopoverContent>
          </Popover>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-1 gap-2 rounded-full pl-1.5 pr-2.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-gradient-brand text-xs text-white">
                    {user ? initials(user.name) : <UserRound className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate text-sm font-medium md:inline">{user?.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate font-medium">{user?.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.roles?.[0]}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <RouterNavLink to="/app/settings" className="gap-2">
                  <Settings className="size-4" />
                  School settings
                </RouterNavLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive focus:text-destructive">
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
