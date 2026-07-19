import { apiClient } from '@/api/client'
import type { ApiToken, ApiTokenScope, CreatedApiToken } from '@/types/apiTokens'

export async function listApiTokens(): Promise<ApiToken[]> {
  const { data } = await apiClient.get<{ data: ApiToken[] }>('/tokens')
  return data.data
}

export interface CreateApiTokenPayload {
  name: string
  abilities?: Extract<ApiTokenScope, 'read-only'>
}

export async function createApiToken(payload: CreateApiTokenPayload): Promise<CreatedApiToken> {
  const { data } = await apiClient.post<{ data: CreatedApiToken }>('/tokens', payload)
  return data.data
}

export async function deleteApiToken(id: number): Promise<void> {
  await apiClient.delete(`/tokens/${id}`)
}
