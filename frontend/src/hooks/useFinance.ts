import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  deleteInvoice,
  feeCategoriesApi,
  feeStructuresApi,
  fetchInvoice,
  generateInvoices,
  listInvoices,
  recordPayment,
  type FeeCategoryPayload,
  type FeeStructurePayload,
  type GenerateInvoicesPayload,
  type ListInvoicesParams,
  type RecordPaymentPayload,
} from '@/api/finance'
import type { FeeCategory, FeeStructure } from '@/types/finance'

export const useFeeCategories = createCrudHooks<FeeCategory, FeeCategoryPayload>('fee-categories', feeCategoriesApi)
export const useFeeStructures = createCrudHooks<FeeStructure, FeeStructurePayload>('fee-structures', feeStructuresApi)

const INVOICES_KEY = ['school', 'invoices'] as const

export function useInvoices(params: ListInvoicesParams = {}) {
  return useQuery({ queryKey: [...INVOICES_KEY, params], queryFn: () => listInvoices(params) })
}

export function useInvoice(id: string) {
  return useQuery({ queryKey: [...INVOICES_KEY, id], queryFn: () => fetchInvoice(id), enabled: Boolean(id) })
}

export function useGenerateInvoices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GenerateInvoicesPayload) => generateInvoices(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVOICES_KEY }),
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: INVOICES_KEY }),
  })
}

export function useRecordPayment(invoiceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RecordPaymentPayload) => recordPayment(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...INVOICES_KEY, invoiceId] })
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY })
    },
  })
}
