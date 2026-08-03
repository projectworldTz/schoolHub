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
  subscription_plan?: string
  license_duration_months: LicenseDurationMonths
  owner_name: string
  owner_email: string
  owner_phone?: string
}

export async function createSchool(payload: CreateSchoolPayload): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>('/platform/schools', payload)
  return data.data
}

export interface UpdateSchoolPayload {
  name?: string
  slug?: string
  type?: School['type']
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  timezone?: string | null
  currency?: string | null
  subscription_plan?: string | null
}

export async function updateSchool(id: string, payload: UpdateSchoolPayload): Promise<School> {
  const { data } = await apiClient.put<{ data: School }>(`/platform/schools/${id}`, payload)
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

export async function setSchoolCustomDomain(id: string, customDomain: string | null): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/custom-domain`, {
    custom_domain: customDomain,
  })
  return data.data
}

export interface GrantAiAccessPayload {
  expires_at?: string | null
  monthly_request_limit?: number | null
}

export async function grantSchoolAiAccess(id: string, payload: GrantAiAccessPayload): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/ai-access/grant`, payload)
  return data.data
}

export async function suspendSchoolAiAccess(id: string, reason: string): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/ai-access/suspend`, { reason })
  return data.data
}

export async function reactivateSchoolAiAccess(id: string): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/ai-access/reactivate`)
  return data.data
}

export async function revokeSchoolAiAccess(id: string): Promise<School> {
  const { data } = await apiClient.post<{ data: School }>(`/platform/schools/${id}/ai-access/revoke`)
  return data.data
}

export async function enterSchool(id: string): Promise<void> {
  await apiClient.post(`/platform/schools/${id}/enter`)
}

export async function exitActingSchool(): Promise<void> {
  await apiClient.post('/platform/exit-school')
}
