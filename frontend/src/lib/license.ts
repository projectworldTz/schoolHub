export type LicenseTier = 'ok' | 'warning' | 'danger' | 'expired'

export interface LicenseStatus {
  daysRemaining: number
  tier: LicenseTier
}

/**
 * Shared by the Super Admin schools list (always shown) and the School
 * Owner dashboard banner (only surfaced once inside the warning window —
 * see DashboardPage). `daysRemaining` is negative once the license has
 * lapsed. Tiers: `ok` (>30 days left), `warning` (8-30 days — friendly
 * reminder), `danger` (1-7 days — urgent), `expired` (0 or fewer).
 */
export function licenseStatus(expiresAt: string | null): LicenseStatus | null {
  if (!expiresAt) return null

  const daysRemaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
  const tier: LicenseTier =
    daysRemaining <= 0 ? 'expired' : daysRemaining <= 7 ? 'danger' : daysRemaining <= 30 ? 'warning' : 'ok'

  return { daysRemaining, tier }
}
