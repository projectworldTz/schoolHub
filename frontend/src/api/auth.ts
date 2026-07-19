import { apiClient, ensureCsrfCookie } from '@/api/client'
import type { User } from '@/types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await apiClient.post<{ data: User }>('/auth/login', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<{ data: User }>('/auth/me')
  return data.data
}
