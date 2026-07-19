import { apiClient } from '@/api/client'
import type { PaginatedResponse, School } from '@/types/school'

export interface ListSchoolsParams {
  status?: string
  search?: string
  page?: number
}

export async function listSchools(params: ListSchoolsParams = {}): Promise<PaginatedResponse<School>> {
  const { data } = await apiClient.get<PaginatedResponse<School>>('/platform/schools', { params })
  return data
}

export interface CreateSchoolPayload {
  name: string
  slug: string
  type: School['type']
  email?: string
  phone?: string
  city?: string
  country?: string
}

export async function createSchool(payload: CreateSchoolPayload): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>('/platform/schools', payload)
  return data.data
}

export async function approveSchool(id: string): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/approve`)
  return data.data
}

export async function suspendSchool(id: string, reason: string): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/suspend`, { reason })
  return data.data
}
