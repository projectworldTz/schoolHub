export type ApiTokenScope = 'full-access' | 'read-only'

export interface ApiToken {
  id: number
  name: string
  scope: ApiTokenScope
  last_used_at: string | null
  created_at: string
}

export interface CreatedApiToken {
  token: string
  id: number
  name: string
  scope: ApiTokenScope
  created_at: string
}
