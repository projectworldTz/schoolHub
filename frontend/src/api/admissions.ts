import { apiClient } from '@/api/client'
import type { PaginatedResponse } from '@/types/school'
import type { AdmissionApplication } from '@/types/admissions'
import type { Student } from '@/types/students'

export interface AdmissionPayload {
  academic_year_id: string
  applying_for_class_id: string
  applicant_first_name: string
  applicant_last_name: string
  date_of_birth?: string
  gender?: string
  guardian_name: string
  guardian_phone: string
  guardian_email?: string
  notes?: string
}

export async function listAdmissions(status = ''): Promise<PaginatedResponse<AdmissionApplication>> {
  const { data } = await apiClient.get<PaginatedResponse<AdmissionApplication>>('/school/admissions', {
    params: { status },
  })
  return data
}

export async function createAdmission(payload: AdmissionPayload): Promise<AdmissionApplication> {
  const { data } = await apiClient.post<{ data: AdmissionApplication }>('/school/admissions', payload)
  return data.data
}

export async function acceptAdmission(id: string): Promise<AdmissionApplication> {
  const { data } = await apiClient.post<{ data: AdmissionApplication }>(`/school/admissions/${id}/accept`)
  return data.data
}

export async function rejectAdmission(id: string, notes?: string): Promise<AdmissionApplication> {
  const { data } = await apiClient.post<{ data: AdmissionApplication }>(`/school/admissions/${id}/reject`, { notes })
  return data.data
}

export async function enrollAdmission(id: string): Promise<Student> {
  const { data } = await apiClient.post<{ data: Student }>(`/school/admissions/${id}/enroll`)
  return data.data
}
