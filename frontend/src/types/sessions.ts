export interface AccountSession {
  id: string
  ip_address: string | null
  user_agent: string | null
  last_active_at: string
  is_current: boolean
}
