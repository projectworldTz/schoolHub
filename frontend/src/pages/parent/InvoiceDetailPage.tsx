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
import { InvoiceCategoryBreakdown } from '@/components/school/InvoiceCategoryBreakdown'
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fee breakdown</CardTitle>
              <CardDescription>What's owed, paid, and remaining per fee category.</CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceCategoryBreakdown invoice={invoice} />
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
                    <TableHead>Fee category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
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
                      <TableCell>{payment.fee_category_name ?? 'Not specified'}</TableCell>
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
