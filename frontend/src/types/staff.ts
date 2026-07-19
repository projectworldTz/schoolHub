import type { Subject } from '@/types/academics'

export interface StaffProfile {
  id: string
  user_id: string
  name?: string
  email?: string
  roles?: string[]
  department_id: string | null
  department_name?: string | null
  branch_id: string | null
  branch_name?: string | null
  staff_number: string
  job_title: string | null
  employment_type: 'full_time' | 'part_time' | 'contract'
  hire_date: string | null
  termination_date: string | null
  bio: string | null
  subjects_taught?: Subject[]
  created_at: string
}

export interface StaffContract {
  id: string
  user_id: string
  user_name?: string
  contract_type: string
  start_date: string
  end_date: string | null
  salary: string | null
  notes: string | null
}

export interface LeaveRequest {
  id: string
  user_id: string
  user_name?: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewer_name?: string | null
  reviewed_at: string | null
  created_at: string
}
