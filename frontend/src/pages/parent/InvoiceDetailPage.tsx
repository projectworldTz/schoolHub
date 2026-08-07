import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InvoiceStatusBadge } from '@/components/school/InvoiceStatusBadge'
import { useChildInvoice } from '@/hooks/useParentPortal'

export function ParentInvoiceDetailPage() {
  const { studentId, invoiceId } = useParams<{ studentId: string; invoiceId: string }>()
  const { data: invoice, isLoading } = useChildInvoice(studentId ?? '', invoiceId ?? '')

  return (
    <div className="space-y-6">
      <Link
        to="/parent/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!isLoading && !invoice && <p className="text-sm text-muted-foreground">Invoice not found.</p>}

      {invoice && (
        <>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {invoice.academic_year_name}
            {invoice.term_name ? ` · ${invoice.term_name}` : ''}
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
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Payment history for this invoice.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
