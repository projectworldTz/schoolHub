import { Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Bell, LogOut, MessageSquare } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useParentAnnouncements, useParentConversations } from '@/hooks/useParentPortal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Logo } from '@/components/layout/Logo'
import { NavigationButtons } from '@/components/layout/NavigationButtons'
import { RefreshButton } from '@/components/layout/RefreshButton'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function ParentLayout() {
  const { data: user } = useCurrentUser()
  const { data: announcements } = useParentAnnouncements()
  const { data: conversations } = useParentConversations()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const unreadMessageCount = conversations?.reduce((sum, c) => sum + c.unread_count, 0) ?? 0

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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-2 gap-y-2 px-3 py-3 sm:px-6">
          <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => navigate('/parent/dashboard')}
              >
                <Bell className="size-4" />
              </Button>
              {Boolean(announcements?.unread_count) && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
                >
                  {announcements!.unread_count}
                </Badge>
              )}
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => navigate('/parent/dashboard')}
              >
                <MessageSquare className="size-4" />
              </Button>
              {unreadMessageCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full p-0 text-[10px]"
                >
                  {unreadMessageCount}
                </Badge>
              )}
            </div>
            <NavigationButtons />
            <RefreshButton />
            <ThemeToggle />
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Avatar className="size-7">
                <AvatarFallback className="bg-gradient-brand text-xs text-white">{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate text-sm font-medium xl:inline">{user?.name}</span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sign out" className="rounded-full" onClick={handleLogout}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="app-content mx-auto min-w-0 max-w-5xl px-3 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
