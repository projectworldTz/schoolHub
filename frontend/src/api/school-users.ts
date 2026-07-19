import { apiClient } from '@/api/client'
import type { PaginatedResponse } from '@/types/school'
import type { User } from '@/types/auth'

export interface CreateSchoolUserPayload {
  name: string
  email: string
  password: string
  roles: string[]
  is_active?: boolean
}

export interface UpdateSchoolUserPayload {
  name?: string
  email?: string
  roles?: string[]
  is_active?: boolean
}

export async function listSchoolUsers(search = ''): Promise<PaginatedResponse<User>> {
  const { data } = await apiClient.get<PaginatedResponse<User>>('/school/users', { params: { search } })
  return data
}

export async function createSchoolUser(payload: CreateSchoolUserPayload): Promise<User> {
  const { data } = await apiClient.post<{ data: User }>('/school/users', payload)
  return data.data
}

export async function updateSchoolUser(id: string, payload: UpdateSchoolUserPayload): Promise<User> {
  const { data } = await apiClient.put<{ data: User }>(`/school/users/${id}`, payload)
  return data.data
}

export async function deleteSchoolUser(id: string): Promise<void> {
  await apiClient.delete(`/school/users/${id}`)
}

export async function listAvailableRoles(): Promise<string[]> {
  const { data } = await apiClient.get<{ data: string[] }>('/school/roles')
  return data.data
}
