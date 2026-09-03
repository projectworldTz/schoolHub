import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  deleteInvoice,
  excludeStudentFee,
  feeCategoriesApi,
  feeStructuresApi,
  fetchInvoice,
  generateInvoices,
  importFees,
  includeStudentFee,
  listInvoices,
  listStudentFeeExclusions,
  recordPayment,
  reversePayment,
  updateStudentFeeExclusion,
  type ExcludeStudentFeePayload,
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

export function useImportFees() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) => importFees(file, dryRun),
    onSuccess: (result) => {
      if (result.committed) {
        queryClient.invalidateQueries({ queryKey: INVOICES_KEY })
      }
    },
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

export function useReversePayment(invoiceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) => reversePayment(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...INVOICES_KEY, invoiceId] })
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY })
    },
  })
}

function feeExclusionsKey(studentId: string, academicYearId: string) {
  return ['school', 'students', studentId, 'fee-exclusions', academicYearId] as const
}

export function useStudentFeeExclusions(studentId: string, academicYearId: string) {
  return useQuery({
    queryKey: feeExclusionsKey(studentId, academicYearId),
    queryFn: () => listStudentFeeExclusions(studentId, academicYearId),
    enabled: Boolean(studentId) && Boolean(academicYearId),
  })
}

export function useExcludeStudentFee(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExcludeStudentFeePayload) => excludeStudentFee(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'students', studentId, 'fee-exclusions'] })
      queryClient.invalidateQueries({ queryKey: INVOICES_KEY })
    },
  })
}

export function useUpdateStudentFeeExclusion(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ exclusionId, reason }: { exclusionId: string; reason: string }) =>
      updateStudentFeeExclusion(studentId, exclusionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'students', studentId, 'fee-exclusions'] })
    },
  })
}

export function useIncludeStudentFee(studentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (exclusionId: string) => includeStudentFee(studentId, exclusionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school', 'students', studentId, 'fee-exclusions'] })
    },
  })
}
