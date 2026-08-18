import {
  Archive,
  ArrowUpCircle,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Coins,
  FileBarChart,
  Globe,
  GraduationCap,
  HeartPulse,
  History,
  LayoutGrid,
  Library,
  Megaphone,
  NotebookPen,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Table2,
  UsersRound,
  Users,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export interface NavLink {
  label: string
  to: string
  description: string
  icon: LucideIcon
  /** An array means "any of" — the entry shows if the user holds at least one. */
  permission?: string | string[]
  comingSoon?: boolean
}

export interface NavSection {
  key: string
  label: string
  icon: LucideIcon
  to?: string
  permission?: string | string[]
  links?: NavLink[]
}

/**
 * Exactly 13 top-level entries, matching the module nav bar's fixed icon
 * count — every route that used to live here still does, just regrouped so
 * Attendance/Examinations/Library/Transport/Hostel are their own icon
 * instead of buried a level down. Sections with `links` render as a
 * dropdown (unchanged mega-menu behavior); sections with `to` are a direct
 * link.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    to: '/app/dashboard',
  },
  {
    key: 'students',
    label: 'Students',
    icon: UsersRound,
    links: [
      { label: 'Admissions', to: '/app/admissions', description: 'Applications, review, enrollment', icon: ClipboardList, permission: 'admissions.manage' },
      { label: 'Student List', to: '/app/students', description: 'Profiles, guardians, documents', icon: UsersRound, permission: 'students.manage' },
      { label: 'Discipline', to: '/app/discipline', description: 'Incident records', icon: ShieldCheck, permission: 'discipline.manage' },
      { label: 'Graduation', to: '/app/graduation', description: 'Leaver & transfer records', icon: GraduationCap, permission: 'graduation.manage' },
      { label: 'Promotions', to: '/app/promotions', description: 'Annual class promotion', icon: ArrowUpCircle, permission: 'graduation.manage' },
    ],
  },
  {
    key: 'academics',
    label: 'Academics',
    icon: BookOpen,
    links: [
      { label: 'Subjects & Grading', to: '/app/academics', description: 'Curriculum and grading systems', icon: BookOpen, permission: 'subjects.manage' },
      { label: 'Classes & Streams', to: '/app/classes', description: 'Classes, streams, rooms', icon: Building2, permission: 'classes.manage' },
      { label: 'Timetable', to: '/app/timetable', description: 'Periods and weekly schedule', icon: Table2, permission: 'timetable.manage' },
      { label: 'Homework', to: '/app/homework', description: 'Assignments and submissions', icon: NotebookPen, permission: 'homework.manage' },
      { label: 'Academic Calendar', to: '/app/academic-setup', description: 'Years, terms, holidays', icon: CalendarDays, permission: 'school-settings.manage' },
      { label: 'Courses', to: '/app/courses', description: 'Lesson content by subject', icon: GraduationCap, permission: 'lms.manage' },
    ],
  },
  {
    key: 'teachers',
    label: 'Teachers',
    icon: Briefcase,
    links: [
      { label: 'Staff Directory', to: '/app/staff', description: 'Profiles, subjects, contracts', icon: Briefcase, permission: 'staff.manage' },
      { label: 'Leave Requests', to: '/app/staff', description: 'Review and approve leave', icon: ClipboardList, permission: 'staff.manage' },
      { label: 'Payroll', to: '/app/payroll', description: 'Salaries and payslips', icon: Coins, permission: 'payroll.manage' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: Wallet,
    links: [
      { label: 'Invoices & Fees', to: '/app/finance', description: 'Fee setup, billing, payments', icon: Receipt, permission: 'finance.manage' },
      { label: 'Expenses', to: '/app/expenses', description: 'Spending by category', icon: Wallet, permission: 'expenses.manage' },
      { label: 'Budgets', to: '/app/expenses', description: 'Budget vs. actual reporting', icon: FileBarChart, permission: 'expenses.manage' },
    ],
  },
  {
    key: 'attendance',
    label: 'Attendance',
    icon: CalendarCheck,
    to: '/app/attendance',
    permission: 'attendance.manage',
  },
  {
    key: 'examinations',
    label: 'Examinations',
    icon: FileBarChart,
    to: '/app/exams',
    permission: ['exams.manage', 'exam-marks.record'],
  },
  {
    key: 'library',
    label: 'Library',
    icon: Library,
    to: '/app/library',
    permission: 'library.manage',
  },
  {
    key: 'transport',
    label: 'Transport',
    icon: Bus,
    to: '/app/transport',
    permission: 'transport.manage',
  },
  {
    key: 'hostel',
    label: 'Hostel',
    icon: Building2,
    to: '/app/hostel',
    permission: 'hostel.manage',
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: Megaphone,
    links: [
      { label: 'Announcements', to: '/app/communication', description: 'School, class, and role-wide posts', icon: Megaphone, permission: 'announcements.manage' },
      { label: 'Messages', to: '/app/messages', description: 'Direct messaging', icon: Users },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: BarChart3,
    links: [
      { label: 'Analytics', to: '/app/analytics', description: 'Enrollment, attendance, academics & finance reports', icon: FileBarChart, permission: 'analytics.view' },
      { label: 'Report Library', to: '/app/reports', description: 'Tabular reports with CSV export', icon: FileBarChart, permission: 'analytics.view' },
      { label: 'Audit Log', to: '/app/audit-log', description: 'Who changed what, across finance and grades', icon: History, permission: 'audit-log.view' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    links: [
      { label: 'School Settings', to: '/app/settings', description: 'Profile, branches, departments', icon: Settings, permission: 'school-settings.manage' },
      { label: 'Users & Roles', to: '/app/users', description: 'Staff accounts and permissions', icon: Users, permission: 'users.manage' },
      { label: 'Inventory', to: '/app/inventory', description: 'Supplies and stock levels', icon: Archive, permission: 'inventory.manage' },
      { label: 'School Clinic', to: '/app/clinic', description: 'Health records and visits', icon: HeartPulse, permission: 'clinic.manage' },
      { label: 'Cafeteria', to: '/app/cafeteria', description: 'Daily meal menus', icon: UtensilsCrossed, permission: 'cafeteria.manage' },
    ],
  },
]

/** Surfaced as its own icon in the topbar (not the 13-item module bar) since it's a premium, gated feature rather than a regular module. */
export const AI_ASSISTANT_LINK: NavLink = {
  label: 'AI Assistant',
  to: '/app/ai-assistant',
  description: 'Chat & lesson plans',
  icon: Sparkles,
  permission: 'ai-assistant.use',
}

/** Same reasoning as AI_ASSISTANT_LINK — a premium, gated module kept out of the fixed 13-item bar rather than making it a 14th icon. */
export const WEBSITE_BUILDER_LINK: NavLink = {
  label: 'Website Builder',
  to: '/app/website-builder',
  description: 'Public school website',
  icon: Globe,
  permission: 'website-builder.manage',
}
