import { useState } from 'react'
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
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
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useAcademicYears, useSchoolProfile } from '@/hooks/useSchoolSetup'
import { hasPermission } from '@/lib/permissions'
import { AI_ASSISTANT_LINK, WEBSITE_BUILDER_LINK } from '@/config/nav'
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

/**
 * Row 1 of the app chrome: branding, school/year context, search, and
 * account actions. Always dark navy (--sidebar tokens, see index.css) —
 * unlike the rest of the app it does not follow the light/dark toggle.
 */
export function TopBar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const { data: user } = useCurrentUser()
  const { data: school } = useSchoolProfile()
  const { data: academicYears } = useAcademicYears.useList()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const [schoolMenuOpen, setSchoolMenuOpen] = useState(false)
  const [yearMenuOpen, setYearMenuOpen] = useState(false)
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null)

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        toast.success('Signed out')
        navigate('/login')
      },
    })
  }

  const currentYear = academicYears?.find((y) => y.id === selectedYearId) ?? academicYears?.find((y) => y.is_current) ?? academicYears?.[0]

  return (
    <header className="bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <MobileNav />
        <Logo className="mr-1 shrink-0" onDark />

        <DropdownMenu open={schoolMenuOpen} onOpenChange={setSchoolMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-sidebar-accent hidden shrink-0 gap-1.5 rounded-full pl-1.5 text-white hover:text-white lg:flex"
            >
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

        <DropdownMenu open={yearMenuOpen} onOpenChange={setYearMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-sidebar-accent hidden shrink-0 gap-1.5 rounded-full text-white hover:text-white xl:flex"
            >
              <span className="max-w-28 truncate">{currentYear?.name ?? 'Academic Year'}</span>
              <ChevronDown className="size-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Academic year</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(academicYears ?? []).map((year) => (
              <DropdownMenuItem key={year.id} onClick={() => setSelectedYearId(year.id)} className="gap-2">
                {year.id === (currentYear?.id ?? '') && <Check className="size-4 text-primary" />}
                <span className={cn('flex-1 truncate', year.id !== (currentYear?.id ?? '') && 'pl-6')}>
                  {year.name}
                </span>
                {year.is_current && <span className="text-[10px] text-muted-foreground">Current</span>}
              </DropdownMenuItem>
            ))}
            {(academicYears ?? []).length === 0 && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No academic years set up yet.</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            className="hover:bg-sidebar-accent hidden w-64 items-center justify-between gap-2 rounded-full text-white/70 hover:text-white/70 lg:flex"
            onClick={onOpenSearch}
          >
            <span className="flex items-center gap-2 text-sm">
              <Search className="size-4" />
              Search students, staff, classes, invoices…
            </span>
            <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium">⌘K</kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-sidebar-accent rounded-full text-white hover:text-white lg:hidden"
            onClick={onOpenSearch}
          >
            <Search className="size-4" />
          </Button>

          <QuickAddMenu expanded />

          {hasPermission(user, AI_ASSISTANT_LINK.permission) && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-sidebar-accent rounded-full text-white hover:text-white"
              onClick={() => navigate(AI_ASSISTANT_LINK.to)}
            >
              <Sparkles className="size-4" />
              <span className="sr-only">AI Assistant</span>
            </Button>
          )}

          {hasPermission(user, WEBSITE_BUILDER_LINK.permission) && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-sidebar-accent rounded-full text-white hover:text-white"
              onClick={() => navigate(WEBSITE_BUILDER_LINK.to)}
            >
              <Globe className="size-4" />
              <span className="sr-only">Website Builder</span>
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent relative rounded-full text-white hover:text-white">
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
              <Button variant="ghost" size="icon" className="hover:bg-sidebar-accent hidden rounded-full text-white hover:text-white sm:flex">
                <MessageSquare className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b px-4 py-3 text-sm font-medium">Messages</div>
              <EmptyPanel icon={MessageSquare} title="No messages yet" description="Direct messaging is coming in a future update." />
            </PopoverContent>
          </Popover>

          <span className="text-white [&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
            <ThemeToggle />
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hover:bg-sidebar-accent ml-1 gap-2 rounded-full pl-1.5 pr-2.5 text-white hover:text-white">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-gradient-brand text-xs text-white">
                    {user ? initials(user.name) : <UserRound className="size-3.5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-28 truncate text-sm font-medium md:inline">{user?.name}</span>
                <ChevronDown className="hidden size-3.5 opacity-60 md:inline" />
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
