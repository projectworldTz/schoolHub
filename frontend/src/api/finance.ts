import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { PaginatedResponse } from '@/types/school'
import type { FeeCategory, FeeStructure, Invoice, PaymentMethod } from '@/types/finance'

export interface FeeCategoryPayload {
  name: string
  description?: string
}

export const feeCategoriesApi = createCrudApi<FeeCategory, FeeCategoryPayload>('fee-categories')

export interface FeeStructurePayload {
  academic_year_id: string
  term_id?: string
  school_class_id?: string
  fee_category_id: string
  amount: number
  due_date?: string
}

export const feeStructuresApi = createCrudApi<FeeStructure, FeeStructurePayload>('fee-structures')

export interface ListInvoicesParams {
  status?: string
  student_id?: string
  per_page?: number
}

export async function listInvoices(params: ListInvoicesParams = {}): Promise<PaginatedResponse<Invoice>> {
  const { data } = await apiClient.get<PaginatedResponse<Invoice>>('/school/invoices', { params })
  return data
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

export async function generateInvoices(payload: GenerateInvoicesPayload): Promise<Invoice[]> {
  const { data } = await apiClient.post<{ data: Invoice[] }>('/school/invoices/generate', payload)
  return data.data
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiClient.delete(`/school/invoices/${id}`)
}

export interface RecordPaymentPayload {
  amount: number
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
