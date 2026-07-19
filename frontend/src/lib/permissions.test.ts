import { describe, expect, it } from 'vitest'
import { hasPermission } from '@/lib/permissions'
import type { User } from '@/types/auth'

function userWith(permissions: string[]): User {
  return { permissions } as unknown as User
}

describe('hasPermission', () => {
  it('allows anyone through when no permission is required', () => {
    expect(hasPermission(undefined, undefined)).toBe(true)
    expect(hasPermission(null, undefined)).toBe(true)
  })

  it('denies an unauthenticated user when a permission is required', () => {
    expect(hasPermission(undefined, 'exams.manage')).toBe(false)
  })

  it('checks a single permission string', () => {
    const user = userWith(['exams.manage'])
    expect(hasPermission(user, 'exams.manage')).toBe(true)
    expect(hasPermission(user, 'discipline.manage')).toBe(false)
  })

  it('treats an array as "any of" — passes if the user holds at least one', () => {
    const user = userWith(['exam-marks.record'])
    expect(hasPermission(user, ['exams.manage', 'exam-marks.record'])).toBe(true)
  })

  it('treats an array as "any of" — fails only if the user holds none of them', () => {
    const user = userWith(['discipline.manage'])
    expect(hasPermission(user, ['exams.manage', 'exam-marks.record'])).toBe(false)
  })

  it('a user with no permissions array at all is denied any specific permission', () => {
    const user = { permissions: undefined } as unknown as User
    expect(hasPermission(user, 'exams.manage')).toBe(false)
  })
})
