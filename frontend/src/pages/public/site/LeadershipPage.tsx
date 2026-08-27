import { Users } from 'lucide-react'
import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { PageHeader, EmptyState } from './PageHeader'

export function LeadershipPage() {
  const { slug, data } = usePublicWebsiteContext()
  const members = [...data.leadership].filter((m) => m.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Explore Us" title="Leadership & Management" description="The people guiding our school." />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
        {members.length === 0 ? (
          <EmptyState message="Leadership profiles haven't been published yet." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => (
              <div key={m.id} className="overflow-hidden rounded-2xl border bg-card shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
                <div className="flex h-40 items-center justify-center bg-muted">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <Users className="size-10 text-muted-foreground" />
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-semibold">{m.name}</h2>
                  <p className="text-sm" style={{ color: 'var(--wb-primary)' }}>
                    {m.role_title}
                  </p>
                  {m.bio && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{m.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
