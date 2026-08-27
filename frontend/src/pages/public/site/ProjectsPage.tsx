import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { PageHeader, EmptyState } from './PageHeader'
import { ResearchProjectGrid } from './ResearchProjectGrid'

export function ProjectsPage() {
  const { slug, data } = usePublicWebsiteContext()

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Discover" title="Projects" description="Initiatives and projects our school is proud of." />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        {data.projects.length === 0 ? <EmptyState message="Projects haven't been published yet." /> : <ResearchProjectGrid items={data.projects} />}
      </div>
    </div>
  )
}
