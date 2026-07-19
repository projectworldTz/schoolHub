import { apiClient } from './client'
import type { AuthUser } from '../types/auth'

export interface LoginPayload {
  email: string
  password: string
  device_name: string
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/login', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ data: AuthUser }>('/auth/me')
  return data.data
}
