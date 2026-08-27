import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, GraduationCap, Menu } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { PublicWebsiteData } from '@/types/websiteBuilder'

interface DropdownLink {
  key: string
  label: string
  description?: string
  href: string
}

interface NavTab {
  key: string
  label: string
  href: string
  items?: DropdownLink[]
}

/** Mirrors sectionHasContent's "never link to a blank page" rule, applied to the top-level tabs instead of in-page anchors. */
function buildTabs(slug: string, data: PublicWebsiteData): NavTab[] {
  const base = `/site/${slug}`
  const tabs: NavTab[] = [{ key: 'home', label: 'Home', href: base }]

  const classes = [...data.admission_classes].sort((a, b) => a.sort_order - b.sort_order)
  tabs.push({
    key: 'admission',
    label: 'Admission',
    href: `${base}/admission`,
    items:
      classes.length > 0
        ? classes.map((c) => ({
            key: c.id,
            label: c.class_name ?? 'Class',
            description: c.summary ?? undefined,
            href: `${base}/admission#class-${c.id}`,
          }))
        : undefined,
  })

  const exploreItems: DropdownLink[] = []
  const { settings } = data
  if (settings.mission || settings.vision || settings.core_values) {
    exploreItems.push({ key: 'mvv', label: 'Mission, Vision & Values', href: `${base}/explore-us/mission-vision-values` })
  }
  if (data.leadership.length > 0) {
    exploreItems.push({ key: 'leadership', label: 'Leadership & Management', href: `${base}/explore-us/leadership` })
  }
  if (data.policies.length > 0) {
    exploreItems.push({ key: 'policies', label: 'Policies', href: `${base}/explore-us/policies` })
  }
  if (data.sports_programs.length > 0 || data.sports_media.length > 0) {
    exploreItems.push({ key: 'sports', label: 'Sport & Games', href: `${base}/explore-us/sports` })
  }
  if (exploreItems.length > 0) {
    tabs.push({ key: 'explore-us', label: 'Explore Us', href: exploreItems[0].href, items: exploreItems })
  }

  const departments = [...data.academic_departments].sort((a, b) => a.sort_order - b.sort_order)
  if (departments.length > 0) {
    tabs.push({
      key: 'academic-disciplines',
      label: 'Academic Disciplines',
      href: `${base}/academic-disciplines`,
      items: departments.map((d) => ({
        key: d.id,
        label: d.department_name ?? 'Department',
        href: `${base}/academic-disciplines#dept-${d.id}`,
      })),
    })
  }

  const offices = [...data.offices].sort((a, b) => a.sort_order - b.sort_order)
  if (offices.length > 0) {
    tabs.push({
      key: 'offices-directorates',
      label: 'Offices & Directorates',
      href: `${base}/offices-directorates`,
      items: offices.map((o) => ({
        key: o.id,
        label: o.name,
        href: `${base}/offices-directorates#office-${o.id}`,
      })),
    })
  }

  if (data.research_items.length > 0) {
    tabs.push({ key: 'research-innovation', label: 'Research & Innovation', href: `${base}/research-innovation` })
  }

  if (data.projects.length > 0) {
    tabs.push({ key: 'projects', label: 'Projects', href: `${base}/projects` })
  }

  return tabs
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return scrolled
}

export function SiteNav({ school, slug, data }: { school: PublicWebsiteData['school']; slug: string; data: PublicWebsiteData }) {
  const tabs = buildTabs(slug, data)
  const scrolled = useScrolled()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-background/80 backdrop-blur transition-shadow duration-300',
        scrolled && 'shadow-md shadow-black/5'
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <Link to={`/site/${slug}`} className="flex shrink-0 items-center gap-2.5">
          {school.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--wb-primary)' }}>
              <GraduationCap className="size-4.5" />
            </span>
          )}
          <span className="font-semibold">{school.name}</span>
        </Link>

        <nav className="hidden flex-1 justify-center lg:flex">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="flex-wrap">
              {tabs.map((tab) => {
                const active = tab.href === `/site/${slug}` ? pathname === tab.href : pathname.startsWith(tab.href.split('#')[0])
                if (!tab.items) {
                  return (
                    <NavigationMenuItem key={tab.key}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={tab.href}
                          className={cn(
                            '!bg-transparent whitespace-nowrap px-2.5 py-2 text-sm font-medium text-foreground/70 hover:text-foreground',
                            active && 'text-foreground'
                          )}
                        >
                          {tab.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                }
                return (
                  <NavigationMenuItem key={tab.key}>
                    <NavigationMenuTrigger className={cn('whitespace-nowrap bg-transparent px-2.5 text-sm font-medium', active && 'text-foreground')}>
                      {tab.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="z-50">
                      <ul className="grid w-72 gap-1 p-1">
                        {tab.items.map((item) => (
                          <li key={item.key}>
                            <NavigationMenuLink asChild>
                              <Link to={item.href} className="flex flex-col items-start gap-0.5 rounded-md p-2.5">
                                <span className="text-sm font-medium">{item.label}</span>
                                {item.description && (
                                  <span className="line-clamp-2 text-xs text-muted-foreground">{item.description}</span>
                                )}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )
              })}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="/login"
            className="hidden shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] sm:inline-block"
            style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
          >
            Portal Login
          </a>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border p-2 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{school.name}</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-4 pb-6">
            {tabs.map((tab) =>
              tab.items ? (
                <details key={tab.key} className="group rounded-lg">
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-accent">
                    {tab.label}
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="flex flex-col gap-0.5 py-1 pl-4">
                    {tab.items.map((item) => (
                      <Link
                        key={item.key}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <Link
                  key={tab.key}
                  to={tab.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  {tab.label}
                </Link>
              )
            )}
            <a
              href="/login"
              className="mt-3 rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white"
              style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
            >
              Portal Login
            </a>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
