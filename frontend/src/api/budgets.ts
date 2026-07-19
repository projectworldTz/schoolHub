import { createCrudApi } from '@/api/crud'
import type { Budget } from '@/types/budgets'

export interface BudgetPayload {
  expense_category_id: string
  academic_year_id: string
  amount: number
  notes?: string
}

export const budgetsApi = createCrudApi<Budget, BudgetPayload>('budgets')
