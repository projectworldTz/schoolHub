import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { buildCategoryBreakdown } from '@/lib/invoiceBreakdown'
import type { Invoice } from '@/types/finance'

export function InvoiceCategoryBreakdown({ invoice }: { invoice: Invoice }) {
  const rows = buildCategoryBreakdown(invoice)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fee category</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={4} className="text-center text-muted-foreground">
              No fee items on this invoice.
            </TableCell>
          </TableRow>
        )}
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>{row.label}</TableCell>
            <TableCell className="text-right">{row.total.toLocaleString()}</TableCell>
            <TableCell className="text-right">{row.paid.toLocaleString()}</TableCell>
            <TableCell className="text-right font-medium">{row.remaining.toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-semibold">Total</TableCell>
          <TableCell className="text-right font-semibold">{Number(invoice.total_amount).toLocaleString()}</TableCell>
          <TableCell className="text-right font-semibold">{Number(invoice.amount_paid).toLocaleString()}</TableCell>
          <TableCell className="text-right font-semibold">{Number(invoice.balance).toLocaleString()}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
