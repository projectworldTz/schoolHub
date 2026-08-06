import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ArrowUp,
  Award,
  ChevronDown,
  Download as DownloadIcon,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { usePublicWebsite } from '@/hooks/usePublicWebsite'
import { trackWebsiteEvent, websiteDownloadUrl } from '@/api/publicWebsite'
import { cn } from '@/lib/utils'
import type { PublicWebsiteData, PublicWebsitePerformanceInsights, WebsiteSectionKey } from '@/types/websiteBuilder'

/**
 * Grade-distribution donut needs a fixed, CVD-validated categorical order
 * (dataviz skill § color-formula) — unlike every other color on this page,
 * it deliberately does NOT derive from the school's --wb-primary, since an
 * arbitrary school-picked brand color can't be guaranteed colorblind-safe
 * against its neighbors. Light/dark are the same eight hues, stepped for
 * each surface, in the validated adjacent-safe order.
 */
const GRADE_PALETTE_LIGHT = ['#2a78d6', '#1baf7a', '#eda100', '#eb6834', '#e34948', '#4a3aa7', '#e87ba4', '#008300']
const GRADE_PALETTE_DARK = ['#3987e5', '#199e70', '#c98500', '#d95926', '#e66767', '#9085e9', '#d55181', '#008300']

/**
 * Public, unauthenticated one-page scrolling site — same "no login of any
 * kind" tier as NoticeBoardPage, resolved by slug via Public\WebsiteController.
 * Path-based for now (schoolhub.co.tz/site/{slug}), not a subdomain — see
 * the module's plan doc for why. Rendered as pure CSS custom properties
 * driven by the school's chosen theme, so no per-element visual editor is
 * needed for a "no coding required" theming experience.
 */
export function SchoolWebsitePage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { data, isLoading, isError } = usePublicWebsite(slug)

  useEffect(() => {
    if (data) trackWebsiteEvent(slug, 'page_view')
  }, [data, slug])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-center">
        <p className="text-lg font-semibold">This page isn't available</p>
        <p className="text-sm text-muted-foreground">The school website may not be published yet.</p>
      </div>
    )
  }

  return <SiteRenderer slug={slug} data={data} />
}

function useTrackSectionView(slug: string, sectionKey: WebsiteSectionKey) {
  const ref = useRef<HTMLElement | null>(null)
  const seen = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !seen.current) {
          seen.current = true
          trackWebsiteEvent(slug, 'section_view', sectionKey)
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [slug, sectionKey])

  return ref
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Fires once, the first time the element scrolls into view — used to trigger a one-shot reveal/count-up rather than re-triggering on every scroll pass. */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (prefersReducedMotion()) {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

/** Fade-up-on-scroll wrapper used throughout the page for a cascading "cards arriving" feel. */
function Reveal({
  children,
  delay = 0,
  className,
  style,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        className
      )}
      style={{ ...style, transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  )
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    if (prefersReducedMotion()) {
      setValue(target)
      return
    }
    let raf = 0
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])

  return value
}

/** Highlights whichever section's midpoint the viewport is currently crossing, for the nav tab underline. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')
  const key = ids.join('|')

  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => Boolean(el))
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
    // key (ids.join) is the real dependency; ids itself is a fresh array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return active
}

function useScrollState() {
  const [state, setState] = useState({ scrolled: false, progress: 0 })

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      const top = doc.scrollTop
      setState({ scrolled: top > 8, progress: max > 0 ? Math.min(100, (top / max) * 100) : 0 })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return state
}

function useShowAfterScroll(threshold: number) {
  const [show, setShow] = useState(false)
  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return show
}

const SECTION_LABELS: Record<WebsiteSectionKey, string> = {
  hero: 'Home',
  about: 'About',
  stats: 'Stats',
  facilities: 'Facilities',
  gallery: 'Gallery',
  news: 'News',
  admissions: 'Admissions',
  calendar: 'Calendar',
  testimonials: 'Testimonials',
  contact: 'Contact',
}

/** Mirrors each section component's own "return null" rule, so the nav never links to a tab that has nothing to show. */
function sectionHasContent(key: WebsiteSectionKey, data: PublicWebsiteData): boolean {
  switch (key) {
    case 'hero':
    case 'admissions':
    case 'contact':
      return true
    case 'about':
      return Boolean(data.settings.principal_message || data.settings.mission || data.settings.vision || data.settings.core_values)
    case 'stats':
      return Boolean(data.stats)
    case 'facilities':
      return data.facilities.length > 0
    case 'gallery':
      return data.gallery_albums.some((a) => (a.images ?? []).length > 0)
    case 'news':
      return data.news.length > 0
    case 'calendar':
      return data.calendar_events.length > 0
    case 'testimonials':
      return data.testimonials.length > 0
  }
}

interface NavItem {
  key: WebsiteSectionKey
  label: string
}

function SiteRenderer({ slug, data }: { slug: string; data: PublicWebsiteData }) {
  const { school, settings, sections } = data
  const theme = settings.theme
  const primaryColor = settings.primary_color || theme?.primary_color || '#2563eb'
  const isDark = Boolean(theme?.dark)

  const navItems: NavItem[] = useMemo(
    () => sections.filter((key) => sectionHasContent(key, data)).map((key) => ({ key, label: SECTION_LABELS[key] })),
    [sections, data]
  )

  const style: React.CSSProperties & Record<string, string> = {
    '--wb-primary': primaryColor,
    '--wb-radius': theme?.radius ?? '1rem',
    fontFamily: theme?.font_body ?? 'Inter, sans-serif',
    // Every non-dark preset otherwise shares one identical neutral-white
    // canvas (only --wb-primary, i.e. button color, differed) — that's
    // what read as "just a totally white theme" regardless of which
    // preset was picked. Tinting the canvas itself from the school's own
    // accent color is what actually makes "Luxury" read warm/gold and
    // "Green" read minty, not just their buttons.
    ...(!isDark && {
      '--background': `color-mix(in srgb, ${primaryColor} 5%, white)`,
      '--muted': `color-mix(in srgb, ${primaryColor} 10%, white)`,
      '--card': `color-mix(in srgb, ${primaryColor} 2%, white)`,
      '--border': `color-mix(in srgb, ${primaryColor} 20%, white)`,
    }),
  }

  const renderers: Partial<Record<WebsiteSectionKey, () => React.ReactNode>> = {
    hero: () => <HeroSection key="hero" slug={slug} data={data} navItems={navItems} />,
    about: () => <AboutSection key="about" data={data} />,
    stats: () => <StatsSection key="stats" data={data} isDark={isDark} />,
    facilities: () => <FacilitiesSection key="facilities" data={data} />,
    gallery: () => <GallerySection key="gallery" data={data} />,
    news: () => <NewsSection key="news" data={data} />,
    admissions: () => <AdmissionsSection key="admissions" slug={slug} data={data} />,
    calendar: () => <CalendarSection key="calendar" data={data} />,
    testimonials: () => <TestimonialsSection key="testimonials" data={data} />,
    contact: () => <ContactSection key="contact" data={data} />,
  }

  return (
    <div
      className={cn(
        'public-site min-h-screen scroll-smooth bg-background text-foreground antialiased',
        theme?.dark && 'public-site--dark'
      )}
      style={style}
    >
      <SiteNav school={school} navItems={navItems} />
      <main>{sections.map((key) => renderers[key]?.())}</main>
      <SiteFooter data={data} />
      <BackToTop />

      {settings.custom_css && <style>{settings.custom_css}</style>}
    </div>
  )
}

function SiteNav({ school, navItems }: { school: PublicWebsiteData['school']; navItems: NavItem[] }) {
  const activeKey = useScrollSpy(navItems.map((n) => n.key))
  const { scrolled, progress } = useScrollState()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b bg-background/80 backdrop-blur transition-shadow duration-300',
        scrolled && 'shadow-md shadow-black/5'
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <a href="#hero" className="flex items-center gap-2.5">
          {school.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--wb-primary)' }}>
              <GraduationCap className="size-4.5" />
            </span>
          )}
          <span className="font-semibold">{school.name}</span>
        </a>
        <a
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
        >
          Portal Login
        </a>
      </div>

      {navItems.length > 1 && (
        <nav className="scrollbar-none overflow-x-auto border-t border-border/60">
          <div className="mx-auto flex max-w-6xl gap-1 px-4 sm:px-8">
            {navItems.map((item) => {
              const active = item.key === activeKey
              return (
                <a
                  key={item.key}
                  href={`#${item.key}`}
                  className={cn(
                    'relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                  <span
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-opacity duration-300"
                    style={{ background: 'var(--wb-primary)', opacity: active ? 1 : 0 }}
                  />
                </a>
              )
            })}
          </div>
        </nav>
      )}

      <div
        className="absolute bottom-0 left-0 h-0.5 transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%`, background: 'var(--wb-primary)' }}
      />
    </header>
  )
}

function BackToTop() {
  const show = useShowAfterScroll(600)
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={cn(
        'fixed bottom-6 right-6 z-40 flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
      style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
    >
      <ArrowUp className="size-5" />
    </button>
  )
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal className="mb-10 text-center">
      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--wb-primary)' }}>
        {eyebrow}
      </span>
      <h2 className="font-display mt-2 text-3xl font-bold">{title}</h2>
      <span className="mx-auto mt-4 block h-1 w-14 rounded-full" style={{ background: 'var(--wb-primary)' }} />
    </Reveal>
  )
}

function HeroSection({ slug, data, navItems }: { slug: string; data: PublicWebsiteData; navItems: NavItem[] }) {
  const ref = useTrackSectionView(slug, 'hero')
  const { school, settings } = data
  const hasImage = Boolean(settings.hero_image_url)
  const nextKey = navItems.find((n) => n.key !== 'hero')?.key
  const applyHref = navItems.some((n) => n.key === 'admissions') ? '#admissions' : '/login'

  return (
    <section
      id="hero"
      ref={ref}
      className={cn(
        // isolate: without it, a negative z-index on the image ends up
        // comparing against the page's outer wrapper (which has its own
        // opaque bg-background) instead of staying scoped to this section,
        // so the outer wrapper's background paints over the image and
        // hides it completely — isolate forces this section to be its own
        // stacking context, so z-0 here really does mean "bottom of THIS
        // section" instead of "bottom of the whole page."
        'relative isolate scroll-mt-28 overflow-hidden px-4 py-24 text-center sm:px-8 sm:py-40',
        hasImage && 'text-white'
      )}
    >
      {hasImage ? (
        <>
          {/* Full-strength photo, not a faint watermark — a gradient sits
              on top (not the image itself dimmed) so the photo stays sharp
              everywhere except right behind the text. */}
          <img
            src={settings.hero_image_url!}
            alt={`${school.name} campus`}
            className="absolute inset-0 z-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        </>
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="animate-public-blob absolute -left-20 -top-24 size-72 rounded-full opacity-30 blur-3xl"
            style={{ background: 'var(--wb-primary)' }}
          />
          <div
            className="animate-public-blob absolute -right-16 top-1/4 size-80 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--wb-primary)', animationDelay: '-4s' }}
          />
          <div
            className="animate-public-blob absolute bottom-[-5rem] left-1/3 size-64 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--wb-primary)', animationDelay: '-8s' }}
          />
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-3xl space-y-6">
        <h1 className="animate-public-fade-up font-display text-4xl font-bold tracking-tight drop-shadow-sm sm:text-6xl">
          {school.name}
        </h1>
        {settings.motto && (
          <p
            className={cn('animate-public-fade-up text-xl', hasImage ? 'text-white/90 drop-shadow-sm' : 'text-muted-foreground')}
            style={{ animationDelay: '120ms' }}
          >
            {settings.motto}
          </p>
        )}
        <div
          className="animate-public-fade-up flex flex-wrap items-center justify-center gap-3 pt-2"
          style={{ animationDelay: '240ms' }}
        >
          <a
            href={applyHref}
            className="rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
          >
            Apply Now
          </a>
          <a
            href="/login"
            className={cn(
              'rounded-full border px-6 py-3 text-sm font-semibold shadow-sm transition-transform hover:scale-105',
              hasImage && 'border-white/50 bg-white/10 backdrop-blur-sm'
            )}
            style={{ borderRadius: 'var(--wb-radius)' }}
          >
            Portal Login
          </a>
        </div>
      </div>
      {nextKey && (
        <a
          href={`#${nextKey}`}
          aria-label="Scroll to learn more"
          className={cn(
            'absolute bottom-6 left-1/2 z-10 -translate-x-1/2 animate-bounce transition-opacity hover:opacity-70 sm:bottom-10',
            hasImage ? 'text-white/80' : 'text-muted-foreground'
          )}
        >
          <ChevronDown className="size-6" />
        </a>
      )}
    </section>
  )
}

function AboutSection({ data }: { data: PublicWebsiteData }) {
  const { settings } = data
  const cards = [
    settings.principal_message && {
      key: 'principal',
      title: settings.principal_name ? `Message from ${settings.principal_name}` : "Principal's Message",
      body: settings.principal_message,
    },
    settings.mission && { key: 'mission', title: 'Mission', body: settings.mission },
    settings.vision && { key: 'vision', title: 'Vision', body: settings.vision },
    settings.core_values && { key: 'core_values', title: 'Core Values', body: settings.core_values },
  ].filter((c): c is { key: string; title: string; body: string } => Boolean(c))

  if (cards.length === 0) return null

  return (
    <section id="about" className="scroll-mt-28 mx-auto max-w-5xl px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="Who We Are" title={`About ${data.school.name}`} />
      <div className="grid gap-6 sm:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.key} delay={(i % 2) * 100}>
            <div className="card-hover rounded-2xl border bg-card p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
              <h3 className="mb-2 font-semibold">{c.title}</h3>
              <p className="text-sm text-muted-foreground">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function StatItem({
  icon: Icon,
  label,
  value,
  suffix,
  delay,
}: {
  icon: typeof Users
  label: string
  value: number
  suffix: string
  delay: number
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const count = useCountUp(value, inView)

  return (
    <div
      ref={ref}
      className={cn(
        'text-center transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      )}
      style={{ transitionDelay: inView ? `${delay}ms` : '0ms' }}
    >
      <Icon className="mx-auto mb-2 size-6" style={{ color: 'var(--wb-primary)' }} />
      <p className="text-3xl font-bold tabular-nums">
        {count}
        {suffix}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function StatsSection({ data, isDark }: { data: PublicWebsiteData; isDark: boolean }) {
  const { stats } = data
  if (!stats) return null

  const items = [
    { icon: Users, label: 'Students', value: stats.student_count, suffix: '' },
    { icon: GraduationCap, label: 'Teachers', value: stats.teacher_count, suffix: '' },
    { icon: Award, label: 'Graduates', value: stats.graduate_count, suffix: '' },
    ...(stats.pass_rate !== null ? [{ icon: TrendingUp, label: 'Pass Rate', value: stats.pass_rate, suffix: '%' }] : []),
  ]

  return (
    <section id="stats" className="scroll-mt-28 bg-muted/30 px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="By The Numbers" title="Our Impact" />
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-4">
        {items.map((item, i) => (
          <StatItem key={item.label} {...item} delay={i * 100} />
        ))}
      </div>
      {data.performance_insights && <PerformanceInsights insights={data.performance_insights} isDark={isDark} />}
    </section>
  )
}

function ChartCard({ title, description, className, children }: { title: string; description: string; className?: string; children: React.ReactNode }) {
  return (
    <Reveal className={cn('rounded-2xl border bg-card p-6 shadow-sm', className)} style={{ borderRadius: 'var(--wb-radius)' }}>
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      {children}
    </Reveal>
  )
}

/**
 * "Real numbers, not marketing copy" — everything here is the school's own
 * exam data (see WebsiteController::performanceInsights, gated behind
 * stats_visibility === 'publish'), never sample/placeholder data. Chart
 * chrome (grid, axis, tooltip) uses the page's own design tokens so it sits
 * inside the school's theme; only the grade-distribution slices use the
 * fixed CVD-validated palette (see the module doc-comment above).
 */
function PerformanceInsights({ insights, isDark }: { insights: PublicWebsitePerformanceInsights; isDark: boolean }) {
  const palette = isDark ? GRADE_PALETTE_DARK : GRADE_PALETTE_LIGHT
  const tick = { fill: 'var(--muted-foreground)', fontSize: 12 }
  const tooltipStyle = { borderRadius: 12, border: '1px solid var(--border)', background: 'var(--popover)', fontSize: 13 }
  const hasTrend = insights.pass_rate_trend.length > 1
  const hasSubjects = insights.subject_performance.length > 0
  const hasGrades = insights.grade_distribution.length > 0
  const totalGraded = insights.grade_distribution.reduce((sum, g) => sum + g.count, 0)

  if (!hasTrend && !hasSubjects && !hasGrades) return null

  return (
    <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-2">
      {hasTrend && (
        <ChartCard title="Pass Rate Over The Years" description="Our annual results trend, straight from exam records." className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={insights.pass_rate_trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={tick} width={36} unit="%" />
                <Tooltip cursor={{ stroke: 'var(--wb-primary)', strokeWidth: 1 }} contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Pass rate']} />
                <Line
                  type="monotone"
                  dataKey="pass_rate"
                  stroke="var(--wb-primary)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--wb-primary)', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={1200}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {hasSubjects && (
        <ChartCard title="Subject Performance" description="Average score by subject, most recent academic year.">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={insights.subject_performance} margin={{ top: 20, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={tick} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={tick} width={36} unit="%" />
                <Tooltip cursor={{ fill: 'var(--muted)' }} contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Average']} />
                <Bar dataKey="average_percentage" fill="var(--wb-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={1000}>
                  <LabelList dataKey="average_percentage" position="top" formatter={(v) => `${v}%`} className="fill-foreground text-[11px] font-medium" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {hasGrades && (
        <ChartCard title="Grade Distribution" description="How students graded, most recent academic year.">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-52 w-full shrink-0 sm:w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={insights.grade_distribution}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    isAnimationActive
                    animationDuration={900}
                  >
                    {insights.grade_distribution.map((g, i) => (
                      <Cell key={g.label} fill={palette[i % palette.length]} stroke="var(--card)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value, _name, entry) => [`${value} students`, `Grade ${entry?.payload?.label ?? ''}`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {insights.grade_distribution.map((g, i) => (
                <li key={g.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
                    Grade {g.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {g.count} · {totalGraded > 0 ? Math.round((g.count / totalGraded) * 100) : 0}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartCard>
      )}
    </div>
  )
}

function FacilitiesSection({ data }: { data: PublicWebsiteData }) {
  if (data.facilities.length === 0) return null

  return (
    <section id="facilities" className="scroll-mt-28 mx-auto max-w-6xl px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="What We Offer" title="Facilities" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.facilities.map((f, i) => (
          <Reveal key={f.id} delay={(i % 3) * 100}>
            <div className="card-hover overflow-hidden rounded-2xl border bg-card shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
              {f.image_url && (
                <div className="overflow-hidden">
                  <img
                    src={f.image_url}
                    alt={f.name}
                    className="h-40 w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="font-semibold">{f.name}</h3>
                {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function GallerySection({ data }: { data: PublicWebsiteData }) {
  const images = data.gallery_albums.flatMap((a) => a.images ?? [])
  if (images.length === 0) return null

  return (
    <section id="gallery" className="scroll-mt-28 bg-muted/30 px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="Take A Look" title="Gallery" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.slice(0, 16).map((img, i) => (
          <Reveal key={img.id} delay={(i % 8) * 60}>
            <div className="group relative aspect-square overflow-hidden rounded-xl shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
              <img
                src={img.image_url ?? ''}
                alt={img.caption ?? ''}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {img.caption && (
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="text-xs font-medium text-white">{img.caption}</p>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function NewsSection({ data }: { data: PublicWebsiteData }) {
  if (data.news.length === 0) return null

  return (
    <section id="news" className="scroll-mt-28 mx-auto max-w-5xl px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="Stay Updated" title="News &amp; Announcements" />
      <div className="grid gap-4 sm:grid-cols-2">
        {data.news.slice(0, 6).map((n, i) => (
          <Reveal key={n.id} delay={(i % 2) * 100}>
            <div className="card-hover rounded-2xl border bg-card p-5 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
              <h3 className="font-semibold">{n.announcement.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{n.announcement.body}</p>
              {n.announcement.published_at && (
                <p className="mt-2 text-xs text-muted-foreground">{n.announcement.published_at.slice(0, 10)}</p>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function AdmissionsSection({ slug, data }: { slug: string; data: PublicWebsiteData }) {
  const { settings } = data

  return (
    <section id="admissions" className="scroll-mt-28 bg-muted/30 px-4 py-20 sm:px-8">
      <Reveal>
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--wb-primary)' }}>
            Join Us
          </span>
          <h2 className="font-display mt-2 text-3xl font-bold">Admissions</h2>
          <p
            className="mt-4 inline-block rounded-full px-4 py-1 text-sm font-medium text-white"
            style={{ background: settings.admission_status === 'open' ? '#16a34a' : '#6b7280' }}
          >
            Admissions {settings.admission_status === 'open' ? 'Open' : 'Closed'}
          </p>
          {(settings.admission_open_date || settings.admission_close_date) && (
            <p className="mt-3 text-sm text-muted-foreground">
              {settings.admission_open_date} {settings.admission_close_date ? `– ${settings.admission_close_date}` : ''}
            </p>
          )}
          {settings.admission_requirements && (
            <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-sm text-muted-foreground">{settings.admission_requirements}</p>
          )}
          <a
            href="/login"
            onClick={() => trackWebsiteEvent(slug, 'admission_click')}
            className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
          >
            Apply Now
          </a>
        </div>
      </Reveal>
    </section>
  )
}

function CalendarSection({ data }: { data: PublicWebsiteData }) {
  if (data.calendar_events.length === 0) return null

  return (
    <section id="calendar" className="scroll-mt-28 mx-auto max-w-4xl px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="Save The Date" title="School Calendar" />
      <div className="space-y-3">
        {data.calendar_events.map((ev, i) => (
          <Reveal key={ev.id} delay={(i % 5) * 60}>
            <div
              className="card-hover flex items-center justify-between rounded-xl border bg-card px-4 py-3"
              style={{ borderRadius: 'var(--wb-radius)' }}
            >
              <span className="font-medium">{ev.title}</span>
              <span className="text-sm text-muted-foreground">{ev.start_date}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection({ data }: { data: PublicWebsiteData }) {
  if (data.testimonials.length === 0) return null

  return (
    <section id="testimonials" className="scroll-mt-28 bg-muted/30 px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="Testimonials" title="What People Say" />
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.testimonials.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 100}>
            <div className="card-hover rounded-2xl border bg-card p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
              <p className="text-sm italic text-muted-foreground">&ldquo;{t.message}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold">
                {t.author_name} <span className="font-normal text-muted-foreground capitalize">— {t.author_role}</span>
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function ContactSection({ data }: { data: PublicWebsiteData }) {
  const { school, settings } = data

  return (
    <section id="contact" className="scroll-mt-28 mx-auto max-w-4xl px-4 py-20 sm:px-8">
      <SectionHeading eyebrow="Get In Touch" title="Contact Us" />
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {school.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="size-4" style={{ color: 'var(--wb-primary)' }} /> {school.phone}
            </div>
          )}
          {school.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="size-4" style={{ color: 'var(--wb-primary)' }} /> {school.email}
            </div>
          )}
          {school.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-4" style={{ color: 'var(--wb-primary)' }} /> {school.address}
            </div>
          )}
        </div>
      </Reveal>
      {settings.google_maps_embed_url && (
        <Reveal>
          <iframe
            src={settings.google_maps_embed_url}
            className="mt-8 h-72 w-full rounded-2xl border"
            style={{ borderRadius: 'var(--wb-radius)' }}
            loading="lazy"
            title="Location"
          />
        </Reveal>
      )}
      {data.downloads.length > 0 && (
        <Reveal className="mt-10">
          <h3 className="mb-3 font-semibold">Downloads</h3>
          <div className="flex flex-wrap gap-3">
            {data.downloads.map((d) => (
              <a
                key={d.id}
                href={websiteDownloadUrl(school.slug, d.id)}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
                style={{ borderRadius: 'var(--wb-radius)' }}
              >
                <DownloadIcon className="size-3.5" /> {d.title}
              </a>
            ))}
          </div>
        </Reveal>
      )}
    </section>
  )
}

function SiteFooter({ data }: { data: PublicWebsiteData }) {
  const { school, settings } = data
  const socials = [
    { url: settings.facebook_url, label: 'Facebook' },
    { url: settings.twitter_url, label: 'Twitter / X' },
    { url: settings.instagram_url, label: 'Instagram' },
    { url: settings.youtube_url, label: 'YouTube' },
    { url: settings.linkedin_url, label: 'LinkedIn' },
  ].filter((s) => s.url)

  return (
    <footer className="border-t px-4 py-10 text-center text-sm text-muted-foreground sm:px-8">
      {socials.length > 0 && (
        <div className="mb-4 flex justify-center gap-4">
          {socials.map(({ url, label }) => (
            <a
              key={url}
              href={url!}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
              aria-label={label}
            >
              <Link2 className="size-4" />
              <span className="text-xs">{label}</span>
            </a>
          ))}
        </div>
      )}
      <p>
        © {new Date().getFullYear()} {school.name}. Powered by SchoolHub.
      </p>
    </footer>
  )
}
