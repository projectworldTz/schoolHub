import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useInvoice, useRecordPayment } from '@/hooks/useFinance'
import type { InvoiceStatus, PaymentMethod } from '@/types/finance'

const STATUS_VARIANT: Record<InvoiceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  unpaid: 'secondary',
  partial: 'outline',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'secondary',
}

const paymentSchema = z.object({
  amount: z.string().min(1, 'Required'),
  method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other']),
  provider: z.string().optional(),
  reference: z.string().optional(),
  paid_at: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})

function RecordPaymentDialog({ invoiceId, balance }: { invoiceId: string; balance: string }) {
  const [open, setOpen] = useState(false)
  const record = useRecordPayment(invoiceId)
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: balance,
      method: 'cash' as PaymentMethod,
      provider: '',
      reference: '',
      paid_at: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })
  const method = form.watch('method')

  function onSubmit(values: z.infer<typeof paymentSchema>) {
    record.mutate(
      {
        amount: Number(values.amount),
        method: values.method,
        provider: values.provider || undefined,
        reference: values.reference || undefined,
        paid_at: values.paid_at,
        notes: values.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded')
          form.reset()
          setOpen(false)
        },
        onError: (error) => {
          const message = isAxiosError(error)
            ? (error.response?.data?.message ?? 'Could not record payment')
            : 'Something went wrong'
          toast.error(message)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Record payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paid_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile money</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {method === 'mobile_money' && (
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <FormControl>
                      <Input placeholder="M-Pesa, Airtel Money, Mixx by Yas…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={record.isPending}>
                {record.isPending ? 'Saving…' : 'Record payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const invoiceId = id ?? ''
  const { data: invoice, isLoading } = useInvoice(invoiceId)

  if (isLoading || !invoice) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs extra={invoice.invoice_number} />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
        <Badge variant={STATUS_VARIANT[invoice.status]}>{invoice.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {invoice.student_name} (#{invoice.admission_number}) · {invoice.academic_year_name}
        {invoice.due_date ? ` · Due ${invoice.due_date}` : ''}
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{Number(item.amount).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex items-center gap-6 rounded-lg border p-3 text-sm">
            <p>
              <span className="text-muted-foreground">Total:</span>{' '}
              {Number(invoice.total_amount).toLocaleString()}
            </p>
            <p>
              <span className="text-muted-foreground">Paid:</span>{' '}
              {Number(invoice.amount_paid).toLocaleString()}
            </p>
            <p>
              <span className="text-muted-foreground">Balance:</span>{' '}
              <span className="font-medium">{Number(invoice.balance).toLocaleString()}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>Payment history for this invoice.</CardDescription>
          </div>
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <RecordPaymentDialog invoiceId={invoiceId} balance={invoice.balance} />
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Received by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {invoice.payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.paid_at}</TableCell>
                  <TableCell>{Number(payment.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">
                    {payment.method.replace('_', ' ')}
                    {payment.provider ? ` (${payment.provider})` : ''}
                  </TableCell>
                  <TableCell>{payment.reference ?? '—'}</TableCell>
                  <TableCell>{payment.received_by_name ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
