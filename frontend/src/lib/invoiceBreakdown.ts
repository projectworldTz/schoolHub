import type { Invoice } from '@/types/finance'

export interface CategoryBreakdownRow {
  key: string
  label: string
  total: number
  paid: number
  remaining: number
}

const UNCATEGORIZED_KEY = '__uncategorized'
const UNALLOCATED_KEY = '__unallocated'

/**
 * Groups an invoice's line items and payments by fee category so a parent
 * or accountant can see "Transport: 300,000 total, 300,000 paid, 0
 * remaining" instead of just one lump balance. Items with no fee category
 * (a manual/legacy line item) and payments recorded without one (pre-dating
 * this feature, or a deliberate "not specified" payment) each get their own
 * bucket rather than being dropped, so the per-row totals always add up to
 * the invoice's own total_amount/amount_paid — nothing paid or charged goes
 * unaccounted for.
 */
export function buildCategoryBreakdown(invoice: Invoice): CategoryBreakdownRow[] {
  const rows = new Map<string, CategoryBreakdownRow>()

  function rowFor(key: string, label: string): CategoryBreakdownRow {
    let row = rows.get(key)
    if (!row) {
      row = { key, label, total: 0, paid: 0, remaining: 0 }
      rows.set(key, row)
    }
    return row
  }

  for (const item of invoice.items ?? []) {
    const row = rowFor(item.fee_category_id ?? UNCATEGORIZED_KEY, item.fee_category_name ?? 'Other charges')
    row.total += Number(item.amount)
  }

  for (const payment of invoice.payments ?? []) {
    const row = rowFor(payment.fee_category_id ?? UNALLOCATED_KEY, payment.fee_category_name ?? 'Unallocated payment')
    row.paid += Number(payment.amount)
  }

  return Array.from(rows.values())
    .map((row) => ({ ...row, remaining: row.total - row.paid }))
    .sort((a, b) => a.label.localeCompare(b.label))
}
