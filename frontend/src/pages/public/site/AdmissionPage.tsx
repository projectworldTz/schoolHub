import { trackWebsiteEvent } from '@/api/publicWebsite'
import { usePublicWebsiteContext } from './PublicWebsiteContext'
import { useScrollToHash } from './useScrollToHash'
import { PageHeader, EmptyState } from './PageHeader'

export function AdmissionPage() {
  const { slug, data } = usePublicWebsiteContext()
  useScrollToHash()
  const { settings } = data
  const classes = [...data.admission_classes].filter((c) => c.is_visible).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      <PageHeader slug={slug} eyebrow="Join Us" title="Admission" description="Everything you need to apply, by class." />
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
        <div className="mb-10 rounded-2xl border bg-card p-6 text-center shadow-sm" style={{ borderRadius: 'var(--wb-radius)' }}>
          <p
            className="inline-block rounded-full px-4 py-1 text-sm font-medium text-white"
            style={{ background: settings.admission_status === 'open' ? '#16a34a' : '#6b7280' }}
          >
            Admissions {settings.admission_status === 'open' ? 'Open' : 'Closed'}
          </p>
          {(settings.admission_open_date || settings.admission_close_date) && (
            <p className="mt-3 text-sm text-muted-foreground">
              {settings.admission_open_date} {settings.admission_close_date ? `– ${settings.admission_close_date}` : ''}
            </p>
          )}
          {settings.admission_requirements && (
            <p className="mx-auto mt-4 max-w-xl whitespace-pre-line text-sm text-muted-foreground">{settings.admission_requirements}</p>
          )}
          <a
            href="/login"
            onClick={() => trackWebsiteEvent(slug, 'admission_click')}
            className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
            style={{ background: 'var(--wb-primary)', borderRadius: 'var(--wb-radius)' }}
          >
            Apply Now
          </a>
        </div>

        {classes.length === 0 ? (
          <EmptyState message="Class-by-class admission requirements haven't been published yet." />
        ) : (
          <div className="space-y-4">
            {classes.map((c) => (
              <div
                key={c.id}
                id={`class-${c.id}`}
                className="scroll-mt-28 rounded-2xl border bg-card p-6 shadow-sm"
                style={{ borderRadius: 'var(--wb-radius)' }}
              >
                <h2 className="text-lg font-semibold">{c.class_name ?? 'Class'}</h2>
                {c.summary && <p className="mt-1 text-sm text-muted-foreground">{c.summary}</p>}
                {c.requirements && <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{c.requirements}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
