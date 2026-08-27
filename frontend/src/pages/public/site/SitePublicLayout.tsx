import { useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import { ArrowUp, Link2 } from 'lucide-react'
import { usePublicWebsite } from '@/hooks/usePublicWebsite'
import { trackWebsiteEvent } from '@/api/publicWebsite'
import { cn } from '@/lib/utils'
import { PublicWebsiteContext } from './PublicWebsiteContext'
import { SiteNav } from './SiteNav'
import type { PublicWebsiteData } from '@/types/websiteBuilder'

/**
 * Owns the single usePublicWebsite(slug) fetch for the whole /site/:slug
 * subtree — every child route reads it via usePublicWebsiteContext() instead
 * of re-fetching. Also owns the theme CSS custom properties (--wb-primary
 * etc.) so they apply consistently across every page, not just the old
 * single-scroll homepage.
 */
export function SitePublicLayout() {
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

  return <SiteShell slug={slug} data={data} />
}

function SiteShell({ slug, data }: { slug: string; data: PublicWebsiteData }) {
  const { school, settings } = data
  const theme = settings.theme
  const primaryColor = settings.primary_color || theme?.primary_color || '#2563eb'
  const isDark = Boolean(theme?.dark)

  const style: React.CSSProperties & Record<string, string> = {
    '--wb-primary': primaryColor,
    '--wb-radius': theme?.radius ?? '1rem',
    fontFamily: theme?.font_body ?? 'Inter, sans-serif',
    ...(!isDark && {
      '--background': `color-mix(in srgb, ${primaryColor} 5%, white)`,
      '--muted': `color-mix(in srgb, ${primaryColor} 10%, white)`,
      '--card': `color-mix(in srgb, ${primaryColor} 2%, white)`,
      '--border': `color-mix(in srgb, ${primaryColor} 20%, white)`,
    }),
  }

  return (
    <div
      className={cn('public-site min-h-screen scroll-smooth bg-background text-foreground antialiased', theme?.dark && 'public-site--dark')}
      style={style}
    >
      <PublicWebsiteContext.Provider value={{ slug, data }}>
        <SiteNav school={school} slug={slug} data={data} />
        <main>
          <Outlet />
        </main>
        <SiteFooter data={data} />
        <BackToTop />
      </PublicWebsiteContext.Provider>

      {settings.custom_css && <style>{settings.custom_css}</style>}
    </div>
  )
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
