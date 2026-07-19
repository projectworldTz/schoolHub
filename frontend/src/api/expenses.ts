import { createCrudApi } from '@/api/crud'
import type { Expense, ExpenseCategory } from '@/types/expenses'

export interface ExpenseCategoryPayload {
  name: string
}

export const expenseCategoriesApi = createCrudApi<ExpenseCategory, ExpenseCategoryPayload>('expense-categories')

export interface ExpensePayload {
  expense_category_id: string
  amount: number
  description?: string
  expense_date: string
}

export const expensesApi = createCrudApi<Expense, ExpensePayload>('expenses')
