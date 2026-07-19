export interface User {
  id: string
  school_id: string | null
  name: string
  email: string
  is_active: boolean
  roles: string[]
  permissions: string[]
  created_at: string
}
