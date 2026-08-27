import { Trophy } from 'lucide-react'
import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { PageHeader, EmptyState } from './PageHeader'

export function SportsPage() {
  const { slug, data } = usePublicWebsiteContext()
  const programs = [...data.sports_programs].filter((p) => p.is_visible).sort((a, b) => a.sort_order - b.sort_order)
  const media = [...data.sports_media].filter((m) => m.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Explore Us" title="Sport & Games" description="Our teams, programs, and highlights." />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        {programs.length === 0 && media.length === 0 ? (
          <EmptyState message="Sport & games content hasn't been published yet." />
        ) : (
          <>
            {programs.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programs.map((p) => (
                  <div key={p.id} className="rounded-2xl border bg-card p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
                    <Trophy className="mb-2 size-6" style={{ color: 'var(--wb-primary)' }} />
                    <h2 className="font-semibold">{p.name}</h2>
                    {p.schedule && <p className="mt-1 text-xs font-medium text-muted-foreground">{p.schedule}</p>}
                    {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {media.length > 0 && (
              <div className={programs.length > 0 ? 'mt-14' : ''}>
                <h2 className="mb-6 text-center text-lg font-semibold">Photos & Videos</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {media.map((m) => (
                    <div key={m.id} className="group relative aspect-square overflow-hidden rounded-xl shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
                      {m.media_type === 'video' ? (
                        <video src={m.file_url ?? ''} controls className="h-full w-full object-cover" />
                      ) : (
                        <img src={m.file_url ?? ''} alt={m.caption ?? ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      )}
                      {m.caption && (
                        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/0 to-black/0 p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <p className="text-xs font-medium text-white">{m.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
