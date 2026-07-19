import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { PayrollRun, StaffSalary } from '@/types/payroll'

export interface StaffSalaryPayload {
  user_id: string
  basic_salary: number
  allowances?: number
  deductions?: number
  effective_from: string
}

export const staffSalariesApi = createCrudApi<StaffSalary, StaffSalaryPayload>('staff-salaries')

export interface PayrollRunPayload {
  month: number
  year: number
}

export async function listPayrollRuns(): Promise<PayrollRun[]> {
  const { data } = await apiClient.get<{ data: PayrollRun[] }>('/school/payroll-runs')
  return data.data
}

export async function fetchPayrollRun(id: string): Promise<PayrollRun> {
  const { data } = await apiClient.get<{ data: PayrollRun }>(`/school/payroll-runs/${id}`)
  return data.data
}

export async function createPayrollRun(payload: PayrollRunPayload): Promise<PayrollRun> {
  const { data } = await apiClient.post<{ data: PayrollRun }>('/school/payroll-runs', payload)
  return data.data
}

export async function deletePayrollRun(id: string): Promise<void> {
  await apiClient.delete(`/school/payroll-runs/${id}`)
}

export async function processPayrollRun(id: string): Promise<PayrollRun> {
  const { data } = await apiClient.post<{ data: PayrollRun }>(`/school/payroll-runs/${id}/process`)
  return data.data
}

export async function markPayslipPaid(id: string) {
  const { data } = await apiClient.post(`/school/payslips/${id}/mark-paid`)
  return data.data
}
