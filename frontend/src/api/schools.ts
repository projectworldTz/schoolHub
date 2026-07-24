import { apiClient } from '@/api/client'
import type { LicenseDurationMonths, PaginatedResponse, PlatformDashboard, School } from '@/types/school'

export async function fetchPlatformDashboard(): Promise<PlatformDashboard> {
  const { data } = await apiClient.get<{ data: PlatformDashboard }>('/platform/dashboard')
  return data.data
}

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
  license_duration_months: LicenseDurationMonths
  owner_name: string
  owner_email: string
  owner_password: string
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

export async function renewSchoolLicense(id: string, months: LicenseDurationMonths): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/renew-license`, { months })
  return data.data
}
