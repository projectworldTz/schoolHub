import { Link } from 'react-router-dom'
import { ArrowRight, FileBarChart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useReportCatalog } from '@/hooks/useReports'
import { useCurrentUser } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'

const CATEGORY_ORDER = ['Academic', 'Attendance', 'Finance', 'HR', 'Facilities']

export function ReportLibraryPage() {
  const { data: user } = useCurrentUser()
  const { data: catalog, isLoading } = useReportCatalog()

  const visible = (catalog ?? []).filter((r) => hasPermission(user, r.permission))
  const categories = CATEGORY_ORDER.filter((cat) => visible.some((r) => r.category === cat))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Report Library</h1>
        <p className="text-sm text-muted-foreground">
          A curated catalog of reports across every module — pick one to view and export as CSV.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && visible.length === 0 && (
        <p className="text-sm text-muted-foreground">No reports available for your role yet.</p>
      )}

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <h2 className="font-display text-base font-semibold">{category}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible
              .filter((r) => r.category === category)
              .map((report) => (
                <Link key={report.key} to={`/app/reports/${report.key}`}>
                  <Card className="card-hover h-full border-none bg-card shadow-sm">
                    <CardContent className="flex flex-col gap-2 p-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-gradient-brand flex size-9 items-center justify-center rounded-lg text-white">
                          <FileBarChart className="size-4" />
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{report.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{report.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      ))}

      {!isLoading && visible.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline">{visible.length} reports available</Badge>
        </div>
      )}
    </div>
  )
}
