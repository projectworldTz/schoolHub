export type SchoolStatus = 'pending' | 'approved' | 'suspended' | 'rejected'

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
  trial_ends_at: string | null
  approved_at: string | null
  suspended_at: string | null
  suspension_reason: string | null
  created_at: string
  updated_at: string
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
