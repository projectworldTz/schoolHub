import { apiClient, apiOrigin } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { PaginatedResponse } from '@/types/school'
import type { FeeCategory, FeeStructure, Invoice, PaymentMethod, StudentFeeExclusion } from '@/types/finance'

export interface FeeCategoryPayload {
  name: string
  description?: string
  is_optional?: boolean
}

export const feeCategoriesApi = createCrudApi<FeeCategory, FeeCategoryPayload>('fee-categories')

export interface FeeStructurePayload {
  academic_year_id: string
  term_id?: string
  school_class_id?: string
  fee_category_id: string
  pay_once?: boolean
  amount: number
  due_date?: string
}

export const feeStructuresApi = createCrudApi<FeeStructure, FeeStructurePayload>('fee-structures')

export interface ListInvoicesParams {
  status?: string
  student_id?: string
  search?: string
  page?: number
  per_page?: number
}

export async function listInvoices(params: ListInvoicesParams = {}): Promise<PaginatedResponse<Invoice>> {
  const { data } = await apiClient.get<PaginatedResponse<Invoice>>('/school/invoices', { params })
  return data
}

export function feeReportPdfUrl(params: { status?: string; search?: string } = {}): string {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.search) query.set('search', params.search)
  const qs = query.toString()
  return `${apiOrigin}/api/school/invoices/pdf${qs ? `?${qs}` : ''}`
}

export async function fetchInvoice(id: string): Promise<Invoice> {
  const { data } = await apiClient.get<{ data: Invoice }>(`/school/invoices/${id}`)
  return data.data
}

export interface GenerateInvoicesPayload {
  academic_year_id: string
  term_id?: string
  school_class_id: string
  fee_structure_ids: string[]
  due_date?: string
}

export interface GenerateInvoicesResult {
  invoices: Invoice[]
  skippedStudents: { id: string; name: string }[]
}

export async function generateInvoices(payload: GenerateInvoicesPayload): Promise<GenerateInvoicesResult> {
  const { data } = await apiClient.post<{ data: Invoice[]; skipped_students: { id: string; name: string }[] }>(
    '/school/invoices/generate',
    payload
  )
  return { invoices: data.data, skippedStudents: data.skipped_students }
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiClient.delete(`/school/invoices/${id}`)
}

export interface RecordPaymentPayload {
  amount: number
  fee_category_id?: string
  method: PaymentMethod
  provider?: string
  reference?: string
  paid_at: string
  notes?: string
}

export async function recordPayment(invoiceId: string, payload: RecordPaymentPayload): Promise<Invoice> {
  const { data } = await apiClient.post<{ data: Invoice }>(`/school/invoices/${invoiceId}/payments`, payload)
  return data.data
}

export async function listStudentFeeExclusions(
  studentId: string,
  academicYearId: string
): Promise<StudentFeeExclusion[]> {
  const { data } = await apiClient.get<{ data: StudentFeeExclusion[] }>(
    `/school/students/${studentId}/fee-exclusions`,
    { params: { academic_year_id: academicYearId } }
  )
  return data.data
}

export interface ExcludeStudentFeePayload {
  fee_category_id: string
  academic_year_id: string
  reason?: string
}

export interface ExcludeStudentFeeResult {
  exclusion: StudentFeeExclusion
  adjustedInvoices: { invoice_number: string; total_amount: string; balance: string }[]
}

export async function excludeStudentFee(
  studentId: string,
  payload: ExcludeStudentFeePayload
): Promise<ExcludeStudentFeeResult> {
  const { data } = await apiClient.post<{
    data: StudentFeeExclusion
    adjusted_invoices: { invoice_number: string; total_amount: string; balance: string }[]
  }>(`/school/students/${studentId}/fee-exclusions`, payload)
  return { exclusion: data.data, adjustedInvoices: data.adjusted_invoices }
}

export async function updateStudentFeeExclusion(
  studentId: string,
  exclusionId: string,
  reason: string
): Promise<StudentFeeExclusion> {
  const { data } = await apiClient.patch<{ data: StudentFeeExclusion }>(
    `/school/students/${studentId}/fee-exclusions/${exclusionId}`,
    { reason }
  )
  return data.data
}

export async function includeStudentFee(studentId: string, exclusionId: string): Promise<void> {
  await apiClient.delete(`/school/students/${studentId}/fee-exclusions/${exclusionId}`)
}
