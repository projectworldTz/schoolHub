import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { rewardCopy, summarizeRewards, type RewardTier } from '@/lib/parentRewards'
import { cn } from '@/lib/utils'
import type { Invoice } from '@/types/finance'

const TIER_STYLES: Record<
  RewardTier,
  { card: string; glow: string; ring: string; bar: string; badge: string }
> = {
  gold: {
    card: 'bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-500/15 dark:via-amber-400/10 dark:to-yellow-500/10',
    glow: 'oklch(0.82 0.17 85 / 70%)',
    ring: 'ring-amber-300/60 dark:ring-amber-400/30',
    bar: 'bg-gradient-to-r from-amber-400 to-yellow-500',
    badge: 'bg-amber-500 text-white',
  },
  silver: {
    card: 'bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-400/15 dark:via-slate-300/10 dark:to-blue-400/10',
    glow: 'oklch(0.85 0.02 260 / 65%)',
    ring: 'ring-slate-300/60 dark:ring-slate-300/25',
    bar: 'bg-gradient-to-r from-slate-400 to-slate-500',
    badge: 'bg-slate-500 text-white',
  },
  bronze: {
    card: 'bg-gradient-to-br from-orange-100 via-amber-50 to-orange-100 dark:from-orange-500/15 dark:via-orange-400/10 dark:to-amber-500/10',
    glow: 'oklch(0.72 0.14 55 / 65%)',
    ring: 'ring-orange-300/60 dark:ring-orange-400/25',
    bar: 'bg-gradient-to-r from-orange-400 to-amber-600',
    badge: 'bg-orange-600 text-white',
  },
  welcome: {
    card: 'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50 dark:from-sky-400/15 dark:via-blue-400/10 dark:to-indigo-400/10',
    glow: 'oklch(0.75 0.11 240 / 60%)',
    ring: 'ring-sky-300/60 dark:ring-sky-400/25',
    bar: 'bg-gradient-to-r from-sky-400 to-indigo-400',
    badge: 'bg-sky-500 text-white',
  },
}

function money(amount: number): string {
  return Math.round(amount).toLocaleString()
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/** A handful of one-shot confetti particles for the Gold "all paid up" moment. */
function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        key: i,
        left: 8 + Math.random() * 84,
        delay: Math.random() * 0.25,
        duration: 1 + Math.random() * 0.6,
        fall: 90 + Math.random() * 60,
        spin: 160 + Math.random() * 200 * (Math.random() > 0.5 ? 1 : -1),
        emoji: ['✨', '🎉', '⭐', '💛'][i % 4],
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.key}
          className="animate-reward-confetti absolute top-2 text-lg"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              '--confetti-duration': `${p.duration}s`,
              '--confetti-fall': `${p.fall}px`,
              '--confetti-spin': `${p.spin}deg`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

function RewardEmoji({ tier, open, size = 'text-5xl' }: { tier: RewardTier; open: boolean; size?: string }) {
  const styles = TIER_STYLES[tier]
  const emoji = tier === 'welcome' ? '✉️' : open ? '🎁' : '🎁'

  return (
    <span className="relative inline-flex items-center justify-center">
      <span
        className={cn('animate-reward-float animate-reward-glow inline-block select-none', size, open && 'animate-reward-open')}
        style={{ '--reward-glow-color': styles.glow } as React.CSSProperties}
      >
        {emoji}
      </span>
      <span
        className="animate-reward-sparkle absolute -right-1 -top-1 text-sm"
        style={{ animationDelay: '0.4s' }}
        aria-hidden="true"
      >
        ✨
      </span>
      <span
        className="animate-reward-sparkle absolute -bottom-1 -left-2 text-xs"
        style={{ animationDelay: '1.1s' }}
        aria-hidden="true"
      >
        ✨
      </span>
    </span>
  )
}

function ProgressBar({ tier, percent }: { tier: RewardTier; percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', TIER_STYLES[tier].bar)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

/**
 * Animated fee-payment recognition, shown per child on the Parent Dashboard.
 * Deliberately not shown at all when the child has no invoices yet
 * (summarizeRewards returns null) — there's nothing to celebrate or
 * encourage until a fee has actually been issued.
 */
export function ParentRewardCard({ studentName, invoices }: { studentName: string; invoices: Invoice[] }) {
  const [open, setOpen] = useState(false)
  const summary = useMemo(() => summarizeRewards(invoices), [invoices])

  if (!summary) return null

  const { tier } = summary
  const styles = TIER_STYLES[tier]
  const copy = rewardCopy(tier)
  const lastPaymentAt = formatDate(summary.lastPaymentAt)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'shadow-premium card-hover w-full rounded-2xl p-5 text-left ring-1 transition-colors',
          styles.card,
          styles.ring
        )}
      >
        <div className="flex items-center gap-4">
          <RewardEmoji tier={tier} open={false} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide', styles.badge)}>
                {copy.label}
              </span>
              <span className="text-xs text-muted-foreground">{studentName}'s fee progress</span>
            </div>
            <p className="mt-1.5 text-sm font-medium">{copy.headline}</p>
            <div className="mt-2.5 flex items-center gap-2">
              <ProgressBar tier={tier} percent={summary.percentPaidDisplay} />
              <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                {Math.round(summary.percentPaidDisplay)}%
              </span>
            </div>
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden sm:max-w-md">
          <div className={cn('relative -mx-6 -mt-6 flex flex-col items-center gap-3 px-6 pb-6 pt-8', styles.card)}>
            {tier === 'gold' && open && <ConfettiBurst />}
            <RewardEmoji tier={tier} open={open} size="text-6xl" />
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', styles.badge)}>
              {copy.label}
            </span>
          </div>

          <DialogHeader>
            <DialogTitle className="text-balance text-center text-base">{copy.headline}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5 text-center text-sm text-muted-foreground">
            {copy.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-2 space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment progress</span>
              <span className="font-semibold tabular-nums">{Math.round(summary.percentPaidDisplay)}%</span>
            </div>
            <ProgressBar tier={tier} percent={summary.percentPaidDisplay} />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payments made</span>
              <span className="font-semibold tabular-nums">{summary.paymentsCount}</span>
            </div>
            {summary.balance > 0 ? (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining balance</span>
                <span className="font-semibold tabular-nums">{money(summary.balance)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">All paid up 🎉</span>
              </div>
            )}
            {lastPaymentAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{tier === 'gold' ? 'Completed on' : 'Last payment'}</span>
                <span className="font-semibold">{lastPaymentAt}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
