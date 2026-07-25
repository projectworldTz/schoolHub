import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, type LucideIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlatformNavLink {
  to: string
  label: string
  icon: LucideIcon
}

/**
 * The Platform Admin shell's own hamburger drawer — mirrors the staff
 * app's MobileNav, since PlatformLayout's desktop <nav> is `hidden sm:flex`
 * with no other way to navigate below that breakpoint.
 */
export function PlatformMobileNav({ links }: { links: PlatformNavLink[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full sm:hidden">
          <Menu className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Navigate</SheetTitle>
        </SheetHeader>
        <div className="space-y-1 p-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium hover:bg-muted',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground'
                )
              }
            >
              <link.icon className="size-4" />
              {link.label}
            </NavLink>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}
