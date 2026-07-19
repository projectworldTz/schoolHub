import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  createPayrollRun,
  deletePayrollRun,
  fetchPayrollRun,
  listPayrollRuns,
  markPayslipPaid,
  processPayrollRun,
  staffSalariesApi,
  type PayrollRunPayload,
  type StaffSalaryPayload,
} from '@/api/payroll'
import type { StaffSalary } from '@/types/payroll'

export const useStaffSalaries = createCrudHooks<StaffSalary, StaffSalaryPayload>('staff-salaries', staffSalariesApi)

const RUNS_KEY = ['school', 'payroll-runs'] as const

export function usePayrollRuns() {
  return useQuery({ queryKey: RUNS_KEY, queryFn: listPayrollRuns })
}

export function usePayrollRun(id: string) {
  return useQuery({ queryKey: [...RUNS_KEY, id], queryFn: () => fetchPayrollRun(id), enabled: Boolean(id) })
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PayrollRunPayload) => createPayrollRun(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RUNS_KEY }),
  })
}

export function useDeletePayrollRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deletePayrollRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RUNS_KEY }),
  })
}

export function useProcessPayrollRun(runId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => processPayrollRun(runId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RUNS_KEY, runId] }),
  })
}

export function useMarkPayslipPaid(runId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markPayslipPaid,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RUNS_KEY, runId] }),
  })
}
