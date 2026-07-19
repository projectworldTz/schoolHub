import { describe, expect, it } from 'vitest'
import { escapeCsvCell } from '@/lib/csv'

describe('escapeCsvCell', () => {
  it('leaves plain text untouched', () => {
    expect(escapeCsvCell('Amina Hassan')).toBe('Amina Hassan')
  })

  it('converts null and undefined to an empty string', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })

  it('stringifies numbers', () => {
    expect(escapeCsvCell(84.33)).toBe('84.33')
  })

  it('quotes and escapes a value containing a comma', () => {
    expect(escapeCsvCell('Kessy, Winnie')).toBe('"Kessy, Winnie"')
  })

  it('quotes and doubles internal quotes', () => {
    expect(escapeCsvCell('She said "hello"')).toBe('"She said ""hello"""')
  })

  it('quotes a value containing a newline', () => {
    expect(escapeCsvCell('line one\nline two')).toBe('"line one\nline two"')
  })
})
