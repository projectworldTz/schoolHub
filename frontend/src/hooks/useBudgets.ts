import { createCrudHooks } from '@/hooks/useCrud'
import { budgetsApi, type BudgetPayload } from '@/api/budgets'
import type { Budget } from '@/types/budgets'

export const useBudgets = createCrudHooks<Budget, BudgetPayload>('budgets', budgetsApi)
