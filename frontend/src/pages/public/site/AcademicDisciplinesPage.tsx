import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { useScrollToHash } from './useScrollToHash'
import { PageHeader, EmptyState } from './PageHeader'

export function AcademicDisciplinesPage() {
  const { slug, data } = usePublicWebsiteContext()
  useScrollToHash()
  const departments = [...data.academic_departments].filter((d) => d.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Academics" title="Academic Disciplines" description="Departments and the subjects they teach." />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        {departments.length === 0 ? (
          <EmptyState message="Academic department profiles haven't been published yet." />
        ) : (
          <div className="space-y-4">
            {departments.map((d) => (
              <div
                key={d.id}
                id={`dept-${d.id}`}
                className="scroll-mt-28 rounded-2xl border bg-card p-6 shadow-sm"
                style={{ borderRadius: 'var(--wb-radius)' }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">{d.department_name ?? 'Department'}</h2>
                  {d.department_code && <span className="text-xs font-medium text-muted-foreground">{d.department_code}</span>}
                </div>
                {d.public_description && <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{d.public_description}</p>}
                {d.subjects && d.subjects.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {d.subjects.map((s) => (
                      <span
                        key={s}
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: 'color-mix(in srgb, var(--wb-primary) 12%, transparent)', color: 'var(--wb-primary)' }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
