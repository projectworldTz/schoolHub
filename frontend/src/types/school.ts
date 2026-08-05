export type SchoolStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

export type AiAccessStatus = 'not_granted' | 'active' | 'suspended' | 'expired'

export type WebsiteAccessStatus = 'not_granted' | 'active' | 'suspended' | 'expired'

export type LicenseDurationMonths = 1 | 3 | 6 | 12

export type SchoolType =
  | 'nursery'
  | 'primary'
  | 'secondary'
  | 'college'
  | 'university'
  | 'vocational'
  | 'other'

export interface School {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  type: SchoolType
  status: SchoolStatus
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  timezone: string | null
  currency: string | null
  logo_path: string | null
  subscription_plan: string | null
  license_expires_at: string | null
  approved_at: string | null
  suspended_at: string | null
  suspension_reason: string | null
  ai_enabled: boolean
  ai_activated_at: string | null
  ai_expires_at: string | null
  ai_suspended_at: string | null
  ai_suspension_reason: string | null
  ai_monthly_request_limit: number | null
  ai_access_status: AiAccessStatus
  ai_requests_this_month: number
  website_enabled: boolean
  website_activated_at: string | null
  website_expires_at: string | null
  website_suspended_at: string | null
  website_suspension_reason: string | null
  website_access_status: WebsiteAccessStatus
  owner?: { name: string; email: string; temporary_password?: string | null } | null
  users_count?: number
  students_count?: number
  teachers_count?: number
  parents_count?: number
  created_at: string
  updated_at: string
}

export interface PlatformStats {
  schools_total: number
  schools_pending: number
  schools_approved: number
  schools_suspended: number
  users_total: number
  licenses_expiring_soon: number
  licenses_expired: number
}

export interface PlatformRecentSchool {
  id: string
  name: string
  type: SchoolType
  status: SchoolStatus
  users_count: number
  created_at: string
}

export interface PlatformActivityEntry {
  id: string
  school_name: string
  user_name: string
  action: string
  description: string
  subject_type: string
  created_at: string
}

export interface PlatformDashboard {
  stats: PlatformStats
  recent_schools: PlatformRecentSchool[]
  recent_activity: PlatformActivityEntry[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
