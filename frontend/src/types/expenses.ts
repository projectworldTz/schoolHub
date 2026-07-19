export interface ExpenseCategory {
  id: string
  name: string
}

export interface Expense {
  id: string
  expense_category_id: string
  category_name?: string
  amount: string
  description: string | null
  expense_date: string
  recorded_by_name?: string
}
