import { describe, expect, it } from 'vitest'
import { SCHOOL_FEATURES, featureForPath } from './schoolFeatures'
import { hasPermission } from '@/lib/permissions'
import type { User } from '@/types/auth'

describe('optional school modules', () => {
  for (const feature of SCHOOL_FEATURES) {
    it(`enforces ${feature.label} even for Super Admin`, () => {
      const user = { roles: ['Super Admin'], permissions: [], [feature.field]: false } as unknown as User
      expect(hasPermission(user, feature.permission)).toBe(false)
      expect(hasPermission({ ...user, [feature.field]: true }, feature.permission)).toBe(true)
      const path = feature.key === 'fee_management' ? 'finance' : feature.key
      expect(featureForPath(`/app/${path}`)?.key).toBe(feature.key)
      expect(featureForPath(`/app/${path}/example`)?.key).toBe(feature.key)
    })
  }
  it('guards reports without blocking unrelated pages', () => {
    expect(featureForPath('/app/reports/library-loans')?.key).toBe('library')
    expect(featureForPath('/app/reports/inventory-stock')?.key).toBe('inventory')
    expect(featureForPath('/app/academics')).toBeUndefined()
    expect(featureForPath('/app/expenses')).toBeUndefined()
  })
})
