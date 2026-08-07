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
import { AlertTriangle } from 'lucide-react'
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
import { InvoiceStatusBadge } from '@/components/school/InvoiceStatusBadge'
import { useInvoice, useRecordPayment } from '@/hooks/useFinance'
import type { PaymentMethod } from '@/types/finance'

const paymentSchema = z.object({
  amount: z.string().min(1, 'Required'),
  method: z.enum(['cash', 'bank_transfer', 'mobile_money', 'card', 'cheque', 'other']),
  provider: z.string().optional(),
  reference: z.string().optional(),
  paid_at: z.string().min(1, 'Required'),
  notes: z.string().optional(),
})

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  mobile_money: 'Mobile money',
  card: 'Card',
  cheque: 'Cheque',
  other: 'Other',
}

function emptyPaymentValues(balance: string) {
  return {
    amount: balance,
    method: 'cash' as PaymentMethod,
    provider: '',
    reference: '',
    paid_at: new Date().toISOString().slice(0, 10),
    notes: '',
  }
}

function RecordPaymentDialog({ invoiceId, balance }: { invoiceId: string; balance: string }) {
  const [open, setOpen] = useState(false)
  const [pendingValues, setPendingValues] = useState<z.infer<typeof paymentSchema> | null>(null)
  const record = useRecordPayment(invoiceId)
  const form = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: emptyPaymentValues(balance),
  })
  const method = form.watch('method')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    setPendingValues(null)
    if (next) {
      // Re-sync to the current outstanding balance every time the dialog is
      // opened, since a prior partial payment can leave the form's original
      // default (the old, higher balance) stale otherwise.
      form.reset(emptyPaymentValues(balance))
    }
  }

  function onReview(values: z.infer<typeof paymentSchema>) {
    if (Number(values.amount) > Number(balance)) {
      form.setError('amount', {
        type: 'max',
        message: `Cannot exceed the outstanding balance of ${Number(balance).toLocaleString()}`,
      })
      return
    }
    setPendingValues(values)
  }

  function onConfirm() {
    if (!pendingValues) return
    record.mutate(
      {
        amount: Number(pendingValues.amount),
        method: pendingValues.method,
        provider: pendingValues.provider || undefined,
        reference: pendingValues.reference || undefined,
        paid_at: pendingValues.paid_at,
        notes: pendingValues.notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded')
          setPendingValues(null)
          form.reset(emptyPaymentValues(balance))
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">Record payment</Button>
      </DialogTrigger>
      <DialogContent>
        {pendingValues ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  You are about to record this payment. Confirm the amount before submitting — it
                  cannot be edited from this screen.
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-3 text-sm">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="text-right font-semibold">
                  {Number(pendingValues.amount).toLocaleString()}
                </dd>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="text-right">{pendingValues.paid_at}</dd>
                <dt className="text-muted-foreground">Method</dt>
                <dd className="text-right">{PAYMENT_METHOD_LABELS[pendingValues.method]}</dd>
                {pendingValues.provider && (
                  <>
                    <dt className="text-muted-foreground">Provider</dt>
                    <dd className="text-right">{pendingValues.provider}</dd>
                  </>
                )}
                {pendingValues.reference && (
                  <>
                    <dt className="text-muted-foreground">Reference</dt>
                    <dd className="text-right">{pendingValues.reference}</dd>
                  </>
                )}
                {pendingValues.notes && (
                  <>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="text-right">{pendingValues.notes}</dd>
                  </>
                )}
              </dl>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={record.isPending}
                onClick={() => setPendingValues(null)}
              >
                Back
              </Button>
              <Button type="button" disabled={record.isPending} onClick={onConfirm}>
                {record.isPending ? 'Saving…' : 'Confirm & record payment'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Record payment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onReview)} className="space-y-4">
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
                  <Button type="submit">Review payment</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
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
        <InvoiceStatusBadge status={invoice.status} />
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
