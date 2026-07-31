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

export interface ActivateAccountPayload {
  email: string
  token: string
  password: string
}

export async function activateAccount(payload: ActivateAccountPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await apiClient.post<{ data: User }>('/auth/activate-account', payload)
  return data.data
}

export interface ForgotPasswordPayload {
  email: string
}

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
  await ensureCsrfCookie()
  await apiClient.post('/auth/forgot-password', payload)
}

export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await apiClient.post<{ data: User }>('/auth/reset-password', payload)
  return data.data
}

export interface ChangePasswordPayload {
  password: string
}

export async function changePassword(payload: ChangePasswordPayload): Promise<User> {
  await ensureCsrfCookie()
  const { data } = await apiClient.post<{ data: User }>('/auth/change-password', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<{ data: User }>('/auth/me')
  return data.data
}
