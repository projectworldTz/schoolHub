import { describe, expect, it } from 'vitest'
import { summarizeRewards } from '@/lib/parentRewards'
import type { Invoice } from '@/types/finance'

function invoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-1',
    invoice_number: 'INV-1',
    student_id: 'student-1',
    academic_year_id: 'year-1',
    term_id: null,
    total_amount: '100000',
    amount_paid: '0',
    balance: '100000',
    status: 'unpaid',
    due_date: null,
    payments: [],
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('summarizeRewards', () => {
  it('returns null when the child has no invoices yet', () => {
    expect(summarizeRewards([])).toBeNull()
  })

  it('is welcome tier before any payment has been made', () => {
    const summary = summarizeRewards([invoice({ amount_paid: '0', balance: '100000' })])

    expect(summary?.tier).toBe('welcome')
    expect(summary?.paymentsCount).toBe(0)
  })

  it('is bronze tier after a first payment under 70%', () => {
    const summary = summarizeRewards([
      invoice({
        amount_paid: '20000',
        balance: '80000',
        payments: [{ id: 'p1', invoice_id: 'inv-1', fee_category_id: null, amount: '20000', method: 'cash', provider: null, reference: null, paid_at: '2026-02-01', notes: null }],
      }),
    ])

    expect(summary?.tier).toBe('bronze')
    expect(summary?.percentPaidDisplay).toBeCloseTo(20)
  })

  it('is silver tier between 70% and 99%', () => {
    const summary = summarizeRewards([invoice({ amount_paid: '75000', balance: '25000' })])

    expect(summary?.tier).toBe('silver')
  })

  it('is gold tier at exactly 100%', () => {
    const summary = summarizeRewards([invoice({ amount_paid: '100000', balance: '0' })])

    expect(summary?.tier).toBe('gold')
  })

  it('is still gold on an overpayment, with a negative balance and a clamped display percent', () => {
    const summary = summarizeRewards([invoice({ amount_paid: '250000', balance: '-150000' })])

    expect(summary?.tier).toBe('gold')
    expect(summary?.balance).toBe(-150000)
    expect(summary?.percentPaidDisplay).toBe(100)
    expect(summary?.percentPaid).toBeGreaterThan(100)
  })

  it('aggregates across multiple invoices rather than looking at just one', () => {
    const summary = summarizeRewards([
      invoice({ id: 'a', total_amount: '100000', amount_paid: '100000', balance: '0' }),
      invoice({ id: 'b', total_amount: '100000', amount_paid: '0', balance: '100000' }),
    ])

    // 50% aggregate — below the 70% silver threshold, so bronze despite one
    // invoice individually being fully paid.
    expect(summary?.tier).toBe('bronze')
    expect(summary?.percentPaidDisplay).toBeCloseTo(50)
  })

  it('picks the most recent payment date across all invoices', () => {
    const summary = summarizeRewards([
      invoice({
        id: 'a',
        payments: [
          { id: 'p1', invoice_id: 'a', fee_category_id: null, amount: '1', method: 'cash', provider: null, reference: null, paid_at: '2026-01-05', notes: null },
        ],
      }),
      invoice({
        id: 'b',
        payments: [
          { id: 'p2', invoice_id: 'b', fee_category_id: null, amount: '1', method: 'cash', provider: null, reference: null, paid_at: '2026-03-20', notes: null },
        ],
      }),
    ])

    expect(summary?.lastPaymentAt).toBe('2026-03-20')
  })
})
