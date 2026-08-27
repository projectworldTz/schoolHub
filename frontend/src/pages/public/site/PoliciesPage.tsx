import { FileText } from 'lucide-react'
import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { PageHeader, EmptyState } from './PageHeader'

export function PoliciesPage() {
  const { slug, data } = usePublicWebsiteContext()
  const policies = [...data.policies].filter((p) => p.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Explore Us" title="Policies" description="School rules, guidelines, and downloadable documents." />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        {policies.length === 0 ? (
          <EmptyState message="Policies haven't been published yet." />
        ) : (
          <div className="space-y-4">
            {policies.map((p) => (
              <div key={p.id} className="rounded-2xl border bg-card p-6 shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold">{p.title}</h2>
                  {p.document_url && (
                    <a
                      href={p.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50"
                    >
                      <FileText className="size-3.5" /> Document
                    </a>
                  )}
                </div>
                {p.content && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{p.content}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
