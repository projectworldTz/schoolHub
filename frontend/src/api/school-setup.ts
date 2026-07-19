import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { AcademicYear, Branch, Department, Holiday, Term } from '@/types/school-setup'
import type { School } from '@/types/school'

export const branchesApi = createCrudApi<Branch>('branches')
export const departmentsApi = createCrudApi<Department>('departments')
export const academicYearsApi = createCrudApi<AcademicYear>('academic-years')
export const holidaysApi = createCrudApi<Holiday>('holidays')

export async function fetchSchoolProfile(): Promise<School> {
  const { data } = await apiClient.get<{ data: School }>('/school/profile')
  return data.data
}

export async function updateSchoolProfile(payload: Partial<School>): Promise<School> {
  const { data } = await apiClient.put<{ data: School }>('/school/profile', payload)
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
