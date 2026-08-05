import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Award,
  Download as DownloadIcon,
  GraduationCap,
  Link2,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  Users,
} from 'lucide-react'
import { usePublicWebsite } from '@/hooks/usePublicWebsite'
import { trackWebsiteEvent, websiteDownloadUrl } from '@/api/publicWebsite'
import { cn } from '@/lib/utils'
import type { PublicWebsiteData, WebsiteSectionKey } from '@/types/websiteBuilder'

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

function SiteRenderer({ slug, data }: { slug: string; data: PublicWebsiteData }) {
  const { school, settings, sections } = data
  const theme = settings.theme
  const primaryColor = settings.primary_color || theme?.primary_color || '#2563eb'

  const style: React.CSSProperties & Record<string, string> = {
    '--wb-primary': primaryColor,
    '--wb-radius': theme?.radius ?? '1rem',
    fontFamily: theme?.font_body ?? 'Inter, sans-serif',
  }

  const renderers: Partial<Record<WebsiteSectionKey, () => React.ReactNode>> = {
    hero: () => <HeroSection key="hero" slug={slug} data={data} />,
    about: () => <AboutSection key="about" data={data} />,
    stats: () => <StatsSection key="stats" data={data} />,
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
      className={`min-h-screen scroll-smooth bg-background text-foreground antialiased ${theme?.dark ? 'dark' : ''}`}
      style={style}
    >
      <SiteNav school={school} />
      <main>{sections.map((key) => renderers[key]?.())}</main>
      <SiteFooter data={data} />

      {settings.custom_css && <style>{settings.custom_css}</style>}
    </div>
  )
}

function SiteNav({ school }: { school: PublicWebsiteData['school'] }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-2.5">
          {school.logo_url ? (
            <img src={school.logo_url} alt={school.name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-lg text-white" style={{ background: 'var(--wb-primary)' }}>
              <GraduationCap className="size-4.5" />
            </span>
          )}
          <span className="font-semibold">{school.name}</span>
        </div>
        <a
          href="/login"
          className="rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02]"
          style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
        >
          Portal Login
        </a>
      </div>
    </header>
  )
}

function HeroSection({ slug, data }: { slug: string; data: PublicWebsiteData }) {
  const ref = useTrackSectionView(slug, 'hero')
  const { school, settings } = data
  const hasImage = Boolean(settings.hero_image_url)

  return (
    <section
      ref={ref}
      className={cn(
        'relative overflow-hidden px-4 py-24 text-center sm:px-8 sm:py-40',
        hasImage && 'text-white'
      )}
    >
      {hasImage && (
        <>
          {/* Full-strength photo, not a faint watermark — a gradient sits
              on top (not the image itself dimmed) so the photo stays sharp
              everywhere except right behind the text. */}
          <img
            src={settings.hero_image_url!}
            alt={`${school.name} campus`}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        </>
      )}
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm sm:text-6xl">{school.name}</h1>
        {settings.motto && (
          <p className={cn('text-xl', hasImage ? 'text-white/90 drop-shadow-sm' : 'text-muted-foreground')}>
            {settings.motto}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#admissions"
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
    </section>
  )
}

function AboutSection({ data }: { data: PublicWebsiteData }) {
  const { settings } = data
  if (!settings.principal_message && !settings.mission && !settings.vision && !settings.core_values) return null

  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">About {data.school.name}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {settings.principal_message && (
          <div className="rounded-2xl border p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            <h3 className="mb-2 font-semibold">{settings.principal_name ? `Message from ${settings.principal_name}` : "Principal's Message"}</h3>
            <p className="text-sm text-muted-foreground">{settings.principal_message}</p>
          </div>
        )}
        {settings.mission && (
          <div className="rounded-2xl border p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            <h3 className="mb-2 font-semibold">Mission</h3>
            <p className="text-sm text-muted-foreground">{settings.mission}</p>
          </div>
        )}
        {settings.vision && (
          <div className="rounded-2xl border p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            <h3 className="mb-2 font-semibold">Vision</h3>
            <p className="text-sm text-muted-foreground">{settings.vision}</p>
          </div>
        )}
        {settings.core_values && (
          <div className="rounded-2xl border p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            <h3 className="mb-2 font-semibold">Core Values</h3>
            <p className="text-sm text-muted-foreground">{settings.core_values}</p>
          </div>
        )}
      </div>
    </section>
  )
}

function StatsSection({ data }: { data: PublicWebsiteData }) {
  const { stats } = data
  if (!stats) return null

  const items = [
    { icon: Users, label: 'Students', value: stats.student_count },
    { icon: GraduationCap, label: 'Teachers', value: stats.teacher_count },
    { icon: Award, label: 'Graduates', value: stats.graduate_count },
    ...(stats.pass_rate !== null ? [{ icon: TrendingUp, label: 'Pass Rate', value: `${stats.pass_rate}%` }] : []),
  ]

  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <item.icon className="mx-auto mb-2 size-6" style={{ color: 'var(--wb-primary)' }} />
            <p className="text-3xl font-bold">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FacilitiesSection({ data }: { data: PublicWebsiteData }) {
  if (data.facilities.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">Facilities</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.facilities.map((f) => (
          <div key={f.id} className="overflow-hidden rounded-2xl border shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            {f.image_url && <img src={f.image_url} alt={f.name} className="h-40 w-full object-cover" />}
            <div className="p-5">
              <h3 className="font-semibold">{f.name}</h3>
              {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function GallerySection({ data }: { data: PublicWebsiteData }) {
  const images = data.gallery_albums.flatMap((a) => a.images ?? [])
  if (images.length === 0) return null

  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">Gallery</h2>
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.slice(0, 16).map((img) => (
          <img
            key={img.id}
            src={img.image_url ?? ''}
            alt={img.caption ?? ''}
            className="aspect-square w-full rounded-xl object-cover shadow-sm"
            style={{ borderRadius: 'var(--wb-radius)' }}
          />
        ))}
      </div>
    </section>
  )
}

function NewsSection({ data }: { data: PublicWebsiteData }) {
  if (data.news.length === 0) return null

  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">News &amp; Announcements</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.news.slice(0, 6).map((n) => (
          <div key={n.id} className="rounded-2xl border p-5 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            <h3 className="font-semibold">{n.announcement.title}</h3>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{n.announcement.body}</p>
            {n.announcement.published_at && (
              <p className="mt-2 text-xs text-muted-foreground">{n.announcement.published_at.slice(0, 10)}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function AdmissionsSection({ slug, data }: { slug: string; data: PublicWebsiteData }) {
  const { settings } = data

  return (
    <section id="admissions" className="bg-muted/30 px-4 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold">Admissions</h2>
        <p className="mt-3 inline-block rounded-full px-4 py-1 text-sm font-medium text-white" style={{ background: settings.admission_status === 'open' ? '#16a34a' : '#6b7280' }}>
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
          className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg"
          style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
        >
          Apply Now
        </a>
      </div>
    </section>
  )
}

function CalendarSection({ data }: { data: PublicWebsiteData }) {
  if (data.calendar_events.length === 0) return null

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">School Calendar</h2>
      <div className="space-y-3">
        {data.calendar_events.map((ev) => (
          <div key={ev.id} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderRadius: 'var(--wb-radius)' }}>
            <span className="font-medium">{ev.title}</span>
            <span className="text-sm text-muted-foreground">{ev.start_date}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection({ data }: { data: PublicWebsiteData }) {
  if (data.testimonials.length === 0) return null

  return (
    <section className="bg-muted/30 px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">What People Say</h2>
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.testimonials.map((t) => (
          <div key={t.id} className="rounded-2xl border p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
            <p className="text-sm italic text-muted-foreground">&ldquo;{t.message}&rdquo;</p>
            <p className="mt-4 text-sm font-semibold">
              {t.author_name} <span className="font-normal text-muted-foreground capitalize">— {t.author_role}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ContactSection({ data }: { data: PublicWebsiteData }) {
  const { school, settings } = data

  return (
    <section id="contact" className="mx-auto max-w-4xl px-4 py-20 sm:px-8">
      <h2 className="mb-10 text-center text-3xl font-bold">Contact Us</h2>
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
      {settings.google_maps_embed_url && (
        <iframe
          src={settings.google_maps_embed_url}
          className="mt-8 h-72 w-full rounded-2xl border"
          style={{ borderRadius: 'var(--wb-radius)' }}
          loading="lazy"
          title="Location"
        />
      )}
      {data.downloads.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-3 font-semibold">Downloads</h3>
          <div className="flex flex-wrap gap-3">
            {data.downloads.map((d) => (
              <a
                key={d.id}
                href={websiteDownloadUrl(school.slug, d.id)}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:border-primary/50"
                style={{ borderRadius: 'var(--wb-radius)' }}
              >
                <DownloadIcon className="size-3.5" /> {d.title}
              </a>
            ))}
          </div>
        </div>
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
            <a key={url} href={url!} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground" aria-label={label}>
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
