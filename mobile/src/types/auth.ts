export interface AuthUser {
  id: string
  school_id: string | null
  name: string
  email: string
  is_active: boolean
  roles: string[]
  permissions: string[]
}
