export interface User {
  id: string
  school_id: string | null
  name: string
  email: string
  phone: string | null
  is_active: boolean
  must_change_password: boolean
  /** True when `email` is a system-generated stand-in, not a real inbox. */
  has_placeholder_email: boolean
  /** Only present in the response right after a placeholder-email account is created — shown once. */
  temporary_password?: string | null
  roles: string[]
  permissions: string[]
  /** Super Admin only: the school they've currently "entered", if any. */
  acting_school?: { id: string; name: string } | null
  created_at: string
}
