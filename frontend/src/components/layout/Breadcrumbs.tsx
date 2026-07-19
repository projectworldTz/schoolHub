import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const PATH_LABELS: Record<string, string> = {
  '/app/dashboard': 'Dashboard',
  '/app/settings': 'School Settings',
  '/app/academic-setup': 'Academic Calendar',
  '/app/classes': 'Classes & Streams',
  '/app/academics': 'Academics',
  '/app/students': 'Students',
  '/app/staff': 'Staff',
  '/app/admissions': 'Admissions',
  '/app/attendance': 'Attendance',
  '/app/discipline': 'Discipline',
  '/app/graduation': 'Graduation',
  '/app/timetable': 'Timetable',
  '/app/homework': 'Homework',
  '/app/communication': 'Communication',
  '/app/messages': 'Messages',
  '/app/exams': 'Examinations',
  '/app/courses': 'Courses',
  '/app/finance': 'Finance',
  '/app/payroll': 'Payroll',
  '/app/expenses': 'Expenses',
  '/app/library': 'Library',
  '/app/hostel': 'Hostel',
  '/app/transport': 'Transport',
  '/app/inventory': 'Inventory',
  '/app/clinic': 'School Clinic',
  '/app/cafeteria': 'Cafeteria',
  '/app/analytics': 'Analytics',
  '/app/reports': 'Report Library',
  '/app/audit-log': 'Audit Log',
  '/app/ai-assistant': 'AI Assistant',
  '/app/users': 'Users & Roles',
  '/platform/schools': 'Schools',
}

/**
 * Detail routes whose "list" lives at a different URL than a plain prefix
 * strip would produce — e.g. an invoice's parent is the Finance page's
 * Invoices tab (`/app/finance`), not a standalone `/app/invoices` route.
 * exam-subjects has no list page of its own at all, so it points back to
 * the exam list instead of the (non-existent) specific exam.
 */
const DETAIL_PARENT_OVERRIDES: Record<string, { label: string; to: string }> = {
  '/app/invoices': { label: 'Finance', to: '/app/finance' },
  '/app/payroll-runs': { label: 'Payroll', to: '/app/payroll' },
  '/app/exam-subjects': { label: 'Examinations', to: '/app/exams' },
}

export interface Crumb {
  label: string
  to?: string
}

/**
 * Auto-derives crumbs from the current path for plain `/app/<page>` routes.
 * Pages with a dynamic trailing segment (e.g. a student's name) pass `extra`
 * to append a final, non-clickable crumb without needing a full override.
 */
export function Breadcrumbs({ extra }: { extra?: string }) {
  const { pathname } = useLocation()
  if (pathname === '/app/dashboard') return null

  const base = PATH_LABELS[pathname]
  const parentPath = '/' + pathname.split('/').slice(0, -1).join('/').replace(/^\/+/, '')
  const override = DETAIL_PARENT_OVERRIDES[parentPath]
  const parentLabel = !base ? (override?.label ?? PATH_LABELS[parentPath]) : undefined
  const parentTo = override?.to ?? parentPath

  const crumbs: Crumb[] = [{ label: 'Dashboard', to: '/app/dashboard' }]
  if (base) {
    crumbs.push({ label: base })
  } else if (parentLabel) {
    crumbs.push({ label: parentLabel, to: parentTo }, { label: extra ?? '…' })
  }

  if (crumbs.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      <Home className="size-3.5" />
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" />}
          {crumb.to ? (
            <Link to={crumb.to} className="transition-colors hover:text-foreground">
              {crumb.label}
            </Link>
          ) : (
            <span className={cn(index === crumbs.length - 1 && 'font-medium text-foreground')}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
