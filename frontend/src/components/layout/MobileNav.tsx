import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCurrentUser } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'
import { NAV_SECTIONS } from '@/config/nav'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { data: user } = useCurrentUser()
  const navigate = useNavigate()

  function go(to: string) {
    setOpen(false)
    navigate(to)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full xl:hidden">
          <Menu className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Navigate</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="space-y-5 p-4">
            {NAV_SECTIONS.map((section) =>
              section.to ? (
                <Link
                  key={section.key}
                  to={section.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium hover:bg-muted"
                >
                  <section.icon className="size-4" />
                  {section.label}
                </Link>
              ) : (
                <div key={section.key}>
                  <p className="flex items-center gap-2 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    <section.icon className="size-3.5" />
                    {section.label}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {(section.links ?? [])
                      .filter((link) => hasPermission(user, link.permission))
                      .map((link) => (
                        <button
                          key={link.label}
                          type="button"
                          disabled={link.comingSoon}
                          onClick={() => !link.comingSoon && go(link.to)}
                          className={cn(
                            'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm hover:bg-muted disabled:opacity-50',
                          )}
                        >
                          <link.icon className="size-4 text-muted-foreground" />
                          <span className="flex-1">{link.label}</span>
                          {link.comingSoon && <span className="text-[10px] text-muted-foreground">Soon</span>}
                        </button>
                      ))}
                  </div>
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
