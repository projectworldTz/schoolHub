import { describe, expect, it } from 'vitest'
import { visibleNavSections } from '@/lib/navigation'
import { hasPermission } from '@/lib/permissions'
import type { User } from '@/types/auth'

const admin = { roles: ['Super Admin'], permissions: [], fee_management_enabled: true } as unknown as User

describe('school feature navigation', () => {
  it('keeps fees for an enabled school', () => {
    const finance = visibleNavSections(admin).find((section) => section.key === 'finance')
    expect(finance?.label).toBe('Finance')
    expect(finance?.links?.some((link) => link.to === '/app/finance')).toBe(true)
  })

  it('removes fee navigation while preserving expenses when fees are off', () => {
    const user = { ...admin, fee_management_enabled: false }
    const finance = visibleNavSections(user).find((section) => section.key === 'finance')
    expect(finance?.label).toBe('Expenses')
    expect(finance?.links?.map((link) => link.label)).toEqual(['Expenses', 'Budgets'])
    expect(hasPermission(user, 'finance.manage')).toBe(false)
  })

  it('does not treat old cached users without a feature state as enabled', () => {
    const user = { ...admin, fee_management_enabled: undefined }
    expect(hasPermission(user, 'finance.manage')).toBe(false)
    expect(visibleNavSections(user).flatMap((section) => section.links ?? []).some((link) => link.to === '/app/finance')).toBe(false)
  })

  it('removes empty groups from mobile and desktop navigation', () => {
    const user = { ...admin, roles: ['Accountant'], permissions: ['finance.manage'], fee_management_enabled: false }
    expect(visibleNavSections(user).some((section) => section.key === 'finance')).toBe(false)
  })
})
