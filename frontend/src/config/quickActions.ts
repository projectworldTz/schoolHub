import {
  Briefcase,
  BookOpen,
  Coins,
  FileBarChart,
  GraduationCap,
  Library,
  Megaphone,
  Receipt,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'

export interface QuickAction {
  label: string
  to: string
  icon: LucideIcon
  permission?: string
  comingSoon?: boolean
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Add student', to: '/app/students?new=student', icon: UserPlus, permission: 'students.manage' },
  { label: 'Add teacher', to: '/app/staff?new=staff', icon: Briefcase, permission: 'staff.manage' },
  { label: 'New admission', to: '/app/admissions?new=admission', icon: UsersRound, permission: 'admissions.manage' },
  { label: 'Add subject', to: '/app/academics?new=subject', icon: BookOpen, permission: 'subjects.manage' },
  { label: 'Send announcement', to: '/app/communication?new=announcement', icon: Megaphone, permission: 'announcements.manage' },
  { label: 'Create exam', to: '/app/exams?new=exam', icon: FileBarChart, permission: 'exams.manage' },
  { label: 'Create course', to: '/app/courses?new=course', icon: GraduationCap, permission: 'lms.manage' },
  { label: 'Generate invoices', to: '/app/finance?new=invoice', icon: Receipt, permission: 'finance.manage' },
  { label: 'New payroll run', to: '/app/payroll?new=payroll-run', icon: Coins, permission: 'payroll.manage' },
  { label: 'Record loan', to: '/app/library?new=loan', icon: Library, permission: 'library.manage' },
]
