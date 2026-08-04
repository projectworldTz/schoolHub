import type { Invoice } from '@/types/finance'

export type RewardTier = 'gold' | 'silver' | 'bronze' | 'welcome'

export interface RewardSummary {
  tier: RewardTier
  totalBilled: number
  totalPaid: number
  /** total - paid; can be negative on an overpayment, meaning a credit. */
  balance: number
  /** 0-100+, uncapped — a tier can be reached exactly at 100 or via overpayment. */
  percentPaid: number
  /** Same as percentPaid but clamped to [0, 100], for progress-bar widths. */
  percentPaidDisplay: number
  paymentsCount: number
  /** Most recent payment date across every invoice, if any payment exists. */
  lastPaymentAt: string | null
}

const TIER_COPY: Record<RewardTier, { label: string; emoji: string; headline: string; lines: string[] }> = {
  gold: {
    label: 'Outstanding Parent',
    emoji: '🎁',
    headline: '🎉 Congratulations! You have successfully completed all fee payments.',
    lines: [
      "Thank you for your outstanding support and commitment to your child's education.",
      'You are one of our valued Education Partners.',
    ],
  },
  silver: {
    label: 'Excellent Progress',
    emoji: '🎁',
    headline: "You're doing a wonderful job.",
    lines: ['Only a small balance remains. Keep up the great work!', 'Thank you for your continued partnership.'],
  },
  bronze: {
    label: 'Great Start',
    emoji: '🎁',
    headline: 'Thank you for beginning your fee payments.',
    lines: ["Every contribution supports your child's education.", 'We appreciate your continued support.'],
  },
  welcome: {
    label: 'Welcome',
    emoji: '✉️',
    headline: 'Thank you for being part of our school family.',
    lines: [
      'We appreciate every payment you make.',
      'Your partnership helps us provide quality education for every learner.',
    ],
  },
}

export function rewardCopy(tier: RewardTier) {
  return TIER_COPY[tier]
}

/**
 * Reward tier is deliberately based on money actually billed vs. paid across
 * every invoice, not the per-invoice `status` field — a parent with one
 * fully-paid invoice and one brand-new unpaid one shouldn't flicker between
 * tiers depending on which invoice happened to load. Returns null when the
 * child has no invoices at all yet — there is nothing to celebrate or
 * encourage until a fee has actually been issued.
 */
export function summarizeRewards(invoices: Invoice[]): RewardSummary | null {
  if (invoices.length === 0) return null

  const totalBilled = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid), 0)

  if (totalBilled <= 0) return null

  const balance = totalBilled - totalPaid
  const percentPaid = (totalPaid / totalBilled) * 100
  const percentPaidDisplay = Math.max(0, Math.min(100, percentPaid))

  const payments = invoices.flatMap((inv) => inv.payments ?? [])
  const paymentsCount = payments.length
  const lastPaymentAt = payments.reduce<string | null>((latest, p) => {
    if (!latest) return p.paid_at
    return new Date(p.paid_at).getTime() > new Date(latest).getTime() ? p.paid_at : latest
  }, null)

  const tier: RewardTier =
    totalPaid <= 0 ? 'welcome' : percentPaid >= 100 ? 'gold' : percentPaid >= 70 ? 'silver' : 'bronze'

  return { tier, totalBilled, totalPaid, balance, percentPaid, percentPaidDisplay, paymentsCount, lastPaymentAt }
}
