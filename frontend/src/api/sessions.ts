import { apiClient } from '@/api/client'
import type { AccountSession } from '@/types/sessions'

export async function listAccountSessions(): Promise<AccountSession[]> {
  const { data } = await apiClient.get<{ data: AccountSession[] }>('/auth/sessions')
  return data.data
}

export async function revokeAccountSession(id: string): Promise<void> {
  await apiClient.delete(`/auth/sessions/${id}`)
}
