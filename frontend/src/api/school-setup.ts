import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { AcademicYear, Branch, Department, Holiday, SchoolPaymentAccount, Term } from '@/types/school-setup'
import type { School } from '@/types/school'

export const branchesApi = createCrudApi<Branch>('branches')
export const departmentsApi = createCrudApi<Department>('departments')
export const academicYearsApi = createCrudApi<AcademicYear>('academic-years')
export const holidaysApi = createCrudApi<Holiday>('holidays')

export interface SchoolPaymentAccountPayload {
  bank_name: string
  account_name: string
  account_number: string
  currency?: string
}

export const schoolPaymentAccountsApi = createCrudApi<SchoolPaymentAccount, SchoolPaymentAccountPayload>(
  'payment-accounts'
)

export async function fetchSchoolProfile(): Promise<School> {
  const { data } = await apiClient.get<{ data: School }>('/school/profile')
  return data.data
}

export async function updateSchoolProfile(payload: Partial<School>): Promise<School> {
  const { data } = await apiClient.put<{ data: School }>('/school/profile', payload)
  return data.data
}

export async function uploadSchoolLogo(file: File): Promise<School> {
  const form = new FormData()
  form.append('logo', file)
  const { data } = await apiClient.post<{ data: School }>('/school/profile/logo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function removeSchoolLogo(): Promise<School> {
  const { data } = await apiClient.delete<{ data: School }>('/school/profile/logo')
  return data.data
}

export async function listTerms(academicYearId: string): Promise<Term[]> {
  const { data } = await apiClient.get<{ data: Term[] }>(`/school/academic-years/${academicYearId}/terms`)
  return data.data
}

export async function createTerm(academicYearId: string, payload: Partial<Term>): Promise<Term> {
  const { data } = await apiClient.post<{ data: Term }>(`/school/academic-years/${academicYearId}/terms`, payload)
  return data.data
}

export async function updateTerm(id: string, payload: Partial<Term>): Promise<Term> {
  const { data } = await apiClient.put<{ data: Term }>(`/school/terms/${id}`, payload)
  return data.data
}

export async function deleteTerm(id: string): Promise<void> {
  await apiClient.delete(`/school/terms/${id}`)
}
