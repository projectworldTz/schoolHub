import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { PageHeader, EmptyState } from './PageHeader'

export function MissionVisionValuesPage() {
  const { slug, data } = usePublicWebsiteContext()
  const { settings } = data
  const cards = [
    settings.mission && { key: 'mission', title: 'Mission', body: settings.mission },
    settings.vision && { key: 'vision', title: 'Vision', body: settings.vision },
    settings.core_values && { key: 'core_values', title: 'Core Values', body: settings.core_values },
  ].filter((c): c is { key: string; title: string; body: string } => Boolean(c))

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Explore Us" title="Mission, Vision & Values" />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        {cards.length === 0 ? (
          <EmptyState message="Not published yet." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {cards.map((c) => (
              <div key={c.key} className="rounded-2xl border bg-card p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
                <h2 className="mb-2 font-semibold">{c.title}</h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
