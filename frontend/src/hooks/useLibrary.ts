import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCrudHooks } from '@/hooks/useCrud'
import {
  booksApi,
  borrowBook,
  listBookLoans,
  returnBookLoan,
  type BookPayload,
  type BorrowBookPayload,
} from '@/api/library'
import type { Book } from '@/types/library'

export const useBooks = createCrudHooks<Book, BookPayload>('books', booksApi)

const LOANS_KEY = ['school', 'book-loans'] as const

export function useBookLoans() {
  return useQuery({ queryKey: LOANS_KEY, queryFn: listBookLoans })
}

export function useBorrowBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookId, payload }: { bookId: string; payload: BorrowBookPayload }) => borrowBook(bookId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'books'] })
    },
  })
}

export function useReturnBookLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: returnBookLoan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOANS_KEY })
      queryClient.invalidateQueries({ queryKey: ['school', 'books'] })
    },
  })
}
