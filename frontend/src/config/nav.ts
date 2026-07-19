import {
  Archive,
  BookOpen,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Coins,
  FileBarChart,
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
  Bus,
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

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    to: '/app/dashboard',
  },
  {
    key: 'ai-assistant',
    label: 'AI Assistant',
    icon: Sparkles,
    to: '/app/ai-assistant',
    permission: 'ai-assistant.use',
  },
  {
    key: 'students',
    label: 'Students',
    icon: UsersRound,
    links: [
      { label: 'Admissions', to: '/app/admissions', description: 'Applications, review, enrollment', icon: ClipboardList, permission: 'admissions.manage' },
      { label: 'Student List', to: '/app/students', description: 'Profiles, guardians, documents', icon: UsersRound, permission: 'students.manage' },
      { label: 'Attendance', to: '/app/attendance', description: 'Mark and review daily attendance', icon: CalendarCheck, permission: 'attendance.manage' },
      { label: 'Discipline', to: '/app/discipline', description: 'Incident records', icon: ShieldCheck, permission: 'discipline.manage' },
      { label: 'Graduation', to: '/app/graduation', description: 'Leaver & transfer records', icon: GraduationCap, permission: 'graduation.manage' },
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
      { label: 'Examinations', to: '/app/exams', description: 'Marks, grading, report cards', icon: FileBarChart, permission: ['exams.manage', 'exam-marks.record'] },
      { label: 'Courses', to: '/app/courses', description: 'Lesson content by subject', icon: GraduationCap, permission: 'lms.manage' },
    ],
  },
  {
    key: 'staff',
    label: 'Staff',
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
      { label: 'Payroll', to: '/app/payroll', description: 'Salaries and payslips', icon: Coins, permission: 'payroll.manage' },
      { label: 'Expenses', to: '/app/expenses', description: 'Spending by category', icon: Wallet, permission: 'expenses.manage' },
      { label: 'Budgets', to: '/app/expenses', description: 'Budget vs. actual reporting', icon: FileBarChart, permission: 'expenses.manage' },
    ],
  },
  {
    key: 'facilities',
    label: 'Facilities',
    icon: Building2,
    links: [
      { label: 'Library', to: '/app/library', description: 'Catalogue and lending', icon: Library, permission: 'library.manage' },
      { label: 'Hostel', to: '/app/hostel', description: 'Rooms and boarding allocations', icon: Building2, permission: 'hostel.manage' },
      { label: 'Transport', to: '/app/transport', description: 'Routes and vehicle assignments', icon: Bus, permission: 'transport.manage' },
      { label: 'Inventory', to: '/app/inventory', description: 'Supplies and stock levels', icon: Archive, permission: 'inventory.manage' },
      { label: 'School Clinic', to: '/app/clinic', description: 'Health records and visits', icon: HeartPulse, permission: 'clinic.manage' },
      { label: 'Cafeteria', to: '/app/cafeteria', description: 'Daily meal menus', icon: UtensilsCrossed, permission: 'cafeteria.manage' },
    ],
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
    key: 'administration',
    label: 'Administration',
    icon: Settings,
    links: [
      { label: 'School Settings', to: '/app/settings', description: 'Profile, branches, departments', icon: Settings, permission: 'school-settings.manage' },
      { label: 'Users & Roles', to: '/app/users', description: 'Staff accounts and permissions', icon: Users, permission: 'users.manage' },
      { label: 'Analytics', to: '/app/analytics', description: 'Enrollment, attendance, academics & finance reports', icon: FileBarChart, permission: 'analytics.view' },
      { label: 'Report Library', to: '/app/reports', description: 'Tabular reports with CSV export', icon: FileBarChart, permission: 'analytics.view' },
      { label: 'Audit Log', to: '/app/audit-log', description: 'Who changed what, across finance and grades', icon: History, permission: 'audit-log.view' },
    ],
  },
]

export interface ModuleCard {
  label: string
  to: string
  description: string
  icon: LucideIcon
  permission?: string | string[]
  comingSoon?: boolean
}

export const MODULE_CARDS: ModuleCard[] = [
  { label: 'Students', to: '/app/students', description: 'Profiles, guardians & documents', icon: UsersRound, permission: 'students.manage' },
  { label: 'Academics', to: '/app/academics', description: 'Subjects & grading systems', icon: BookOpen, permission: 'subjects.manage' },
  { label: 'Staff', to: '/app/staff', description: 'Directory, contracts & leave', icon: Briefcase, permission: 'staff.manage' },
  { label: 'Admissions', to: '/app/admissions', description: 'Applications & enrollment', icon: ClipboardList, permission: 'admissions.manage' },
  { label: 'Attendance', to: '/app/attendance', description: 'Daily class registers', icon: CalendarCheck, permission: 'attendance.manage' },
  { label: 'Timetable', to: '/app/timetable', description: 'Periods & weekly schedule', icon: Table2, permission: 'timetable.manage' },
  { label: 'Homework', to: '/app/homework', description: 'Assignments & submissions', icon: NotebookPen, permission: 'homework.manage' },
  { label: 'Communication', to: '/app/communication', description: 'School-wide announcements', icon: Megaphone, permission: 'announcements.manage' },
  { label: 'Examinations', to: '/app/exams', description: 'Marks, grading & report cards', icon: FileBarChart, permission: ['exams.manage', 'exam-marks.record'] },
  { label: 'Courses', to: '/app/courses', description: 'Lesson content by subject', icon: GraduationCap, permission: 'lms.manage' },
  { label: 'Finance', to: '/app/finance', description: 'Fees, invoices & payments', icon: Wallet, permission: 'finance.manage' },
  { label: 'Payroll', to: '/app/payroll', description: 'Salaries & payslips', icon: Coins, permission: 'payroll.manage' },
  { label: 'Expenses', to: '/app/expenses', description: 'Spending by category', icon: Receipt, permission: 'expenses.manage' },
  { label: 'Library', to: '/app/library', description: 'Catalogue & lending', icon: Library, permission: 'library.manage' },
  { label: 'Hostel', to: '/app/hostel', description: 'Rooms & boarding allocations', icon: Building2, permission: 'hostel.manage' },
  { label: 'Transport', to: '/app/transport', description: 'Routes & vehicle assignments', icon: Bus, permission: 'transport.manage' },
  { label: 'Inventory', to: '/app/inventory', description: 'Supplies & stock levels', icon: Archive, permission: 'inventory.manage' },
  { label: 'Clinic', to: '/app/clinic', description: 'Health records & visits', icon: HeartPulse, permission: 'clinic.manage' },
  { label: 'Cafeteria', to: '/app/cafeteria', description: 'Daily meal menus', icon: UtensilsCrossed, permission: 'cafeteria.manage' },
  { label: 'Analytics', to: '/app/analytics', description: 'Reports across every module', icon: FileBarChart, permission: 'analytics.view' },
  { label: 'Report Library', to: '/app/reports', description: 'Tabular reports with CSV export', icon: FileBarChart, permission: 'analytics.view' },
  { label: 'AI Assistant', to: '/app/ai-assistant', description: 'Chat & lesson plans', icon: Sparkles, permission: 'ai-assistant.use' },
]
