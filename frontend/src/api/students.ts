import { apiClient } from '@/api/client'
import type { PaginatedResponse } from '@/types/school'
import type { Student, StudentDocument, StudentEnrollment, StudentImportResult } from '@/types/students'

export interface StudentPayload {
  admission_number: string
  first_name: string
  last_name: string
  date_of_birth?: string
  gender?: string
  blood_group?: string
  allergies?: string
  medical_notes?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  previous_school_name?: string
}

export async function listStudents(search = '', branchId?: string): Promise<PaginatedResponse<Student>> {
  const { data } = await apiClient.get<PaginatedResponse<Student>>('/school/students', {
    params: { search, branch_id: branchId || undefined },
  })
  return data
}

export async function createStudent(payload: StudentPayload): Promise<Student> {
  const { data } = await apiClient.post<{ data: Student }>('/school/students', payload)
  return data.data
}

export async function fetchStudent(id: string): Promise<Student> {
  const { data } = await apiClient.get<{ data: Student }>(`/school/students/${id}`)
  return data.data
}

export async function updateStudent(id: string, payload: Partial<StudentPayload>): Promise<Student> {
  const { data } = await apiClient.put<{ data: Student }>(`/school/students/${id}`, payload)
  return data.data
}

export interface AttachGuardianPayload {
  guardian_id?: string
  name?: string
  phone?: string
  email?: string
  occupation?: string
  address?: string
  relationship: string
  is_primary?: boolean
  is_emergency_contact?: boolean
}

export async function attachGuardian(studentId: string, payload: AttachGuardianPayload): Promise<Student> {
  const { data } = await apiClient.post<{ data: Student }>(`/school/students/${studentId}/guardians`, payload)
  return data.data
}

export async function detachGuardian(studentId: string, guardianId: string): Promise<void> {
  await apiClient.delete(`/school/students/${studentId}/guardians/${guardianId}`)
}

export interface GuardianPortalAccess {
  user_id: string
  email: string
  temporary_password: string
}

export async function grantGuardianPortalAccess(guardianId: string, email: string): Promise<GuardianPortalAccess> {
  const { data } = await apiClient.post<{ data: GuardianPortalAccess }>(`/school/guardians/${guardianId}/portal-access`, { email })
  return data.data
}

export interface EnrollPayload {
  academic_year_id: string
  school_class_id: string
  stream_id?: string
  enrolled_at: string
}

export async function listEnrollments(studentId: string): Promise<StudentEnrollment[]> {
  const { data } = await apiClient.get<{ data: StudentEnrollment[] }>(`/school/students/${studentId}/enrollments`)
  return data.data
}

export async function enrollStudent(studentId: string, payload: EnrollPayload): Promise<StudentEnrollment> {
  const { data } = await apiClient.post<{ data: StudentEnrollment }>(`/school/students/${studentId}/enrollments`, payload)
  return data.data
}

export async function listStudentDocuments(studentId: string): Promise<StudentDocument[]> {
  const { data } = await apiClient.get<{ data: StudentDocument[] }>(`/school/students/${studentId}/documents`)
  return data.data
}

export async function uploadStudentDocument(studentId: string, file: File): Promise<StudentDocument> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<{ data: StudentDocument }>(`/school/students/${studentId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function importStudents(file: File, dryRun: boolean): Promise<StudentImportResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('dry_run', dryRun ? 'true' : 'false')
  const { data } = await apiClient.post<{ data: StudentImportResult }>('/school/students/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/school/documents/${documentId}`)
}
