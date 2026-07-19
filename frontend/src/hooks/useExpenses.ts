import { createCrudHooks } from '@/hooks/useCrud'
import { expenseCategoriesApi, expensesApi, type ExpenseCategoryPayload, type ExpensePayload } from '@/api/expenses'
import type { Expense, ExpenseCategory } from '@/types/expenses'

export const useExpenseCategories = createCrudHooks<ExpenseCategory, ExpenseCategoryPayload>(
  'expense-categories',
  expenseCategoriesApi
)
export const useExpenses = createCrudHooks<Expense, ExpensePayload>('expenses', expensesApi)
