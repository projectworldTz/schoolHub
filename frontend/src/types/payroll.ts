export interface StaffSalary {
  id: string
  user_id: string
  user_name?: string
  basic_salary: string
  allowances: string
  deductions: string
  net_salary: string
  effective_from: string
}

export type PayslipStatus = 'pending' | 'paid'

export interface Payslip {
  id: string
  payroll_run_id: string
  user_id: string
  user_name?: string
  basic_salary: string
  allowances: string
  deductions: string
  net_salary: string
  status: PayslipStatus
  paid_at: string | null
}

export type PayrollRunStatus = 'draft' | 'processed' | 'paid'

export interface PayrollRun {
  id: string
  month: number
  year: number
  status: PayrollRunStatus
  processed_at: string | null
  payslips_count?: number
  payslips?: Payslip[]
  created_at: string
}
