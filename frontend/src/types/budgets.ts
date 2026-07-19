export interface Budget {
  id: string
  expense_category_id: string
  category_name?: string
  academic_year_id: string
  academic_year_name?: string
  amount: string
  notes: string | null
}
