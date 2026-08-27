import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { PageHeader, EmptyState } from './PageHeader'
import { ResearchProjectGrid } from './ResearchProjectGrid'

export function ResearchInnovationPage() {
  const { slug, data } = usePublicWebsiteContext()

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Discover" title="Research & Innovation" description="Ongoing research and innovation work at our school." />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        {data.research_items.length === 0 ? (
          <EmptyState message="Research & innovation highlights haven't been published yet." />
        ) : (
          <ResearchProjectGrid items={data.research_items} />
        )}
      </div>
    </div>
  )
}
