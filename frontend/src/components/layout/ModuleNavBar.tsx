import { NavLink as RouterNavLink } from 'react-router-dom'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { MegaMenuContent } from '@/components/layout/MegaMenuContent'
import { useCurrentUser } from '@/hooks/useAuth'
import { useSchoolProfile } from '@/hooks/useSchoolSetup'
import { hasPermission } from '@/lib/permissions'
import { lmsTerm } from '@/lib/schoolTerms'
import { NAV_SECTIONS, type NavLink } from '@/config/nav'
import { cn } from '@/lib/utils'
import type { SchoolType } from '@/types/school'

function resolveLmsLabel(link: NavLink, schoolType: SchoolType | undefined): NavLink {
  if (link.to !== '/app/courses') return link
  const term = lmsTerm(schoolType)
  return { ...link, label: term.plural, description: term.description }
}

const itemClass =
  'flex h-14 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-3 text-[11px] font-medium text-white/70 transition-colors hover:bg-sidebar-accent hover:text-white'
const activeItemClass = 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'

/**
 * Row 2 of the app chrome — one icon per module, always dark navy (see
 * index.css's --sidebar tokens). Sections with sub-pages keep the same
 * dropdown mega-menu behavior as before, just re-skinned to match.
 */
export function ModuleNavBar() {
  const { data: user } = useCurrentUser()
  const { data: school } = useSchoolProfile()

  const visibleSections = NAV_SECTIONS.map((section) => ({
    ...section,
    links: section.links
      ?.filter((link) => hasPermission(user, link.permission))
      .map((link) => resolveLmsLabel(link, school?.type)),
  })).filter((section) => hasPermission(user, section.permission) && (section.to || (section.links && section.links.length > 0)))

  return (
    <div className="bg-sidebar border-sidebar-border hidden border-t xl:block">
      <div className="px-4 sm:px-6">
        <NavigationMenu viewport={false} className="max-w-none justify-start">
          <NavigationMenuList className="gap-0.5 py-1.5">
            {visibleSections.map((section) =>
              section.to ? (
                <NavigationMenuItem key={section.key}>
                  <RouterNavLink
                    to={section.to}
                    className={({ isActive }) => cn(itemClass, isActive && activeItemClass)}
                  >
                    <section.icon className="size-4.5" />
                    {section.label}
                  </RouterNavLink>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={section.key}>
                  <NavigationMenuTrigger className={cn(itemClass, 'bg-transparent data-[state=open]:bg-sidebar-accent data-[state=open]:text-white')}>
                    <section.icon className="size-4.5" />
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
      </div>
    </div>
  )
}
