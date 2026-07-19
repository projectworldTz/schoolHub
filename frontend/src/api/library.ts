import { apiClient } from '@/api/client'
import { createCrudApi } from '@/api/crud'
import type { Book, BookLoan } from '@/types/library'

export interface BookPayload {
  title: string
  author?: string
  isbn?: string
  category?: string
  total_copies: number
}

export const booksApi = createCrudApi<Book, BookPayload>('books')

export async function fetchBook(id: string): Promise<Book> {
  const { data } = await apiClient.get<{ data: Book }>(`/school/books/${id}`)
  return data.data
}

export async function listBookLoans(): Promise<BookLoan[]> {
  const { data } = await apiClient.get<{ data: BookLoan[] }>('/school/book-loans')
  return data.data
}

export interface BorrowBookPayload {
  student_id: string
  borrowed_at?: string
  due_date: string
}

export async function borrowBook(bookId: string, payload: BorrowBookPayload): Promise<BookLoan> {
  const { data } = await apiClient.post<{ data: BookLoan }>(`/school/books/${bookId}/loans`, payload)
  return data.data
}

export async function returnBookLoan(loanId: string): Promise<BookLoan> {
  const { data } = await apiClient.post<{ data: BookLoan }>(`/school/book-loans/${loanId}/return`)
  return data.data
}
