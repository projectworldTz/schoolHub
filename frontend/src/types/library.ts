export interface Book {
  id: string
  title: string
  author: string | null
  isbn: string | null
  category: string | null
  total_copies: number
  available_copies: number
  loans?: BookLoan[]
}

export type BookLoanStatus = 'borrowed' | 'returned' | 'overdue'

export interface BookLoan {
  id: string
  book_id: string
  book_title?: string
  student_id: string
  student_name?: string
  borrowed_at: string | null
  due_date: string | null
  returned_at: string | null
  status: BookLoanStatus
}
