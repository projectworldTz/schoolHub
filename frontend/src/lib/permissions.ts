import { SCHOOL_FEATURES } from '@/config/schoolFeatures'
import type { User } from '@/types/auth'

/**
 * An array means any of the listed permissions. Feature availability is
 * checked before the Super Admin permission bypass. Old cached auth data
 * without a feature state must be refreshed before exposing school fees.
 */
export function hasPermission(user: User | undefined | null, permission?: string | string[]): boolean {
  if (!permission) return true
  const required = Array.isArray(permission) ? permission : [permission]
  return required.some((p) =>
    SCHOOL_FEATURES.every((feature) => feature.permission !== p || user?.[feature.field] === true) &&
    (user?.roles?.includes('Super Admin') || user?.permissions?.includes(p))
  )
}
