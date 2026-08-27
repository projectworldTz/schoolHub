import { Mail, Phone, Building2 } from 'lucide-react'
import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { useScrollToHash } from './useScrollToHash'
import { PageHeader, EmptyState } from './PageHeader'

export function OfficesDirectoratesPage() {
  const { slug, data } = usePublicWebsiteContext()
  useScrollToHash()
  const offices = [...data.offices].filter((o) => o.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Administration" title="Offices & Directorates" description="Who to contact, and what each office handles." />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        {offices.length === 0 ? (
          <EmptyState message="Office & directorate profiles haven't been published yet." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {offices.map((o) => (
              <div
                key={o.id}
                id={`office-${o.id}`}
                className="scroll-mt-28 flex gap-4 rounded-2xl border bg-card p-6 shadow-sm"
                style={{ borderRadius: 'var(--wb-radius)' }}
              >
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                  {o.photo_url ? (
                    <img src={o.photo_url} alt={o.name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{o.name}</h2>
                  {o.directorate_head && (
                    <p className="text-sm" style={{ color: 'var(--wb-primary)' }}>
                      {o.directorate_head}
                    </p>
                  )}
                  {o.description && <p className="mt-2 text-sm text-muted-foreground">{o.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {o.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3.5" /> {o.email}
                      </span>
                    )}
                    {o.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="size-3.5" /> {o.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
