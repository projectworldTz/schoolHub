import { ExternalLink, Lightbulb } from 'lucide-react'
import type { WebsiteResearchProject } from '@/types/websiteBuilder'

export function ResearchProjectGrid({ items }: { items: WebsiteResearchProject[] }) {
  const sorted = [...items].filter((i) => i.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  if (sorted.length === 0) return null

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
          <div className="flex h-36 items-center justify-center bg-muted">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <Lightbulb className="size-8 text-muted-foreground" />
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{item.title}</h2>
              {item.status && (
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: 'color-mix(in srgb, var(--wb-primary) 12%, transparent)', color: 'var(--wb-primary)' }}
                >
                  {item.status}
                </span>
              )}
            </div>
            {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
            {item.link_url && (
              <a
                href={item.link_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                style={{ color: 'var(--wb-primary)' }}
              >
                Learn more <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
