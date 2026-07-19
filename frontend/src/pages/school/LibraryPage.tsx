import { z } from 'zod'
import { useForm, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SimpleCrudCard, type ColumnDef } from '@/components/school/SimpleCrudCard'
import { useQuickAddTrigger } from '@/hooks/useQuickAddTrigger'
import { useStudents } from '@/hooks/useStudents'
import { useBookLoans, useBooks, useBorrowBook, useReturnBookLoan } from '@/hooks/useLibrary'
import type { BookPayload } from '@/api/library'
import type { Book, BookLoanStatus } from '@/types/library'

const bookDefaults = { title: '', author: '', isbn: '', category: '', total_copies: '1' }
const bookSchema = z.object({
  title: z.string().min(1, 'Required'),
  author: z.string().optional(),
  isbn: z.string().optional(),
  category: z.string().optional(),
  total_copies: z.string().min(1, 'Required'),
})

function BooksTab() {
  const { data, isLoading } = useBooks.useList()
  const create = useBooks.useCreate()
  const remove = useBooks.useRemove()
  const form = useForm({ resolver: zodResolver(bookSchema), defaultValues: bookDefaults })

  const columns: ColumnDef<Book>[] = [
    { key: 'title', label: 'Title', render: (b) => b.title },
    { key: 'author', label: 'Author', render: (b) => b.author ?? '—' },
    { key: 'category', label: 'Category', render: (b) => b.category ?? '—' },
    {
      key: 'copies',
      label: 'Copies',
      render: (b) => `${b.available_copies} / ${b.total_copies} available`,
    },
  ]

  return (
    <SimpleCrudCard
      title="Books"
      items={data}
      isLoading={isLoading}
      columns={columns}
      form={form as unknown as UseFormReturn<FieldValues>}
      defaultValues={bookDefaults}
      fields={[
        { name: 'title', label: 'Title', type: 'text' },
        { name: 'author', label: 'Author', type: 'text' },
        { name: 'isbn', label: 'ISBN', type: 'text' },
        { name: 'category', label: 'Category', type: 'text' },
        { name: 'total_copies', label: 'Total copies', type: 'number' },
      ]}
      onCreate={(values) =>
        create.mutateAsync({ ...values, total_copies: Number(values.total_copies) } as unknown as BookPayload)
      }
      onDelete={(item) => remove.mutateAsync(item.id)}
      createLabel="New book"
      quickAddKey="book"
    />
  )
}

const loanSchema = z.object({
  book_id: z.string().min(1, 'Required'),
  student_id: z.string().min(1, 'Required'),
  due_date: z.string().min(1, 'Required'),
})

const STATUS_STYLE: Record<BookLoanStatus, string> = {
  borrowed: 'border-orange-600/20 bg-orange-600/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  returned: 'border-emerald-600/20 bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  overdue: 'border-destructive/20 bg-destructive/15 text-destructive dark:bg-destructive/25',
}

function RecordLoanDialog() {
  const [open, setOpen] = useQuickAddTrigger('loan')
  const { data: books } = useBooks.useList()
  const { data: students } = useStudents('')
  const borrow = useBorrowBook()
  const form = useForm({
    resolver: zodResolver(loanSchema),
    defaultValues: { book_id: '', student_id: '', due_date: '' },
  })

  function onSubmit(values: z.infer<typeof loanSchema>) {
    borrow.mutate(
      { bookId: values.book_id, payload: { student_id: values.student_id, due_date: values.due_date } },
      {
        onSuccess: () => {
          toast.success('Loan recorded')
          form.reset()
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not record loan') : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  const availableBooks = (books ?? []).filter((b) => b.available_copies > 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Record loan</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a loan</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="book_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Book</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a book" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableBooks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.title} ({b.available_copies} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.data.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={borrow.isPending}>
                {borrow.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function LoansTab() {
  const { data: loans, isLoading } = useBookLoans()
  const returnLoan = useReturnBookLoan()

  async function handleReturn(loanId: string) {
    try {
      await returnLoan.mutateAsync(loanId)
      toast.success('Loan marked as returned')
    } catch (error) {
      const message = isAxiosError(error) ? (error.response?.data?.message ?? 'Could not return loan') : 'Something went wrong'
      toast.error(message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Loans</CardTitle>
        <RecordLoanDialog />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Borrowed</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && loans?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No loans recorded yet.
                </TableCell>
              </TableRow>
            )}
            {loans?.map((loan) => (
              <TableRow key={loan.id}>
                <TableCell>{loan.book_title}</TableCell>
                <TableCell>{loan.student_name}</TableCell>
                <TableCell>{loan.borrowed_at ?? '—'}</TableCell>
                <TableCell>{loan.due_date ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={STATUS_STYLE[loan.status]}>
                    {loan.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {loan.status === 'borrowed' && (
                    <Button size="sm" variant="outline" onClick={() => handleReturn(loan.id)}>
                      Return
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-sm text-muted-foreground">Catalogue and lending.</p>
      </div>

      <Tabs defaultValue="loans">
        <TabsList>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
        </TabsList>
        <TabsContent value="loans" className="mt-4">
          <LoansTab />
        </TabsContent>
        <TabsContent value="books" className="mt-4">
          <BooksTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
