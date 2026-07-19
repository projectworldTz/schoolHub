import type { User } from '@/types/auth'

/** An array means "any of" — the nav entry shows if the user holds at least one. */
export function hasPermission(user: User | undefined | null, permission?: string | string[]): boolean {
  if (!permission) return true
  const required = Array.isArray(permission) ? permission : [permission]
  return required.some((p) => user?.permissions?.includes(p))
}
