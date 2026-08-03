export interface User {
  id: string
  school_id: string | null
  name: string
  email: string
  is_active: boolean
  must_change_password: boolean
  roles: string[]
  permissions: string[]
  /** Super Admin only: the school they've currently "entered", if any. */
  acting_school?: { id: string; name: string } | null
  created_at: string
}
