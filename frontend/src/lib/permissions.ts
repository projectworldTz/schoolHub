import type { User } from '@/types/auth'

/**
 * An array means "any of" — the nav entry shows if the user holds at least
 * one. Super Admin short-circuits to true here to mirror the backend's
 * Gate::before hook (AppServiceProvider): they're deliberately seeded with
 * zero explicit permissions and bypass every check server-side instead
 * (RolesAndPermissionsSeeder's docblock), so checking `user.permissions`
 * alone left every permission-gated nav item — Quick Add included —
 * rendering empty for a Super Admin, including while acting as a school.
 */
export function hasPermission(user: User | undefined | null, permission?: string | string[]): boolean {
  if (!permission) return true
  if (user?.roles?.includes('Super Admin')) return true
  const required = Array.isArray(permission) ? permission : [permission]
  return required.some((p) => user?.permissions?.includes(p))
}
