import { describe, it, expect } from 'vitest'
import { formatDate, calculateAge, validatePassword } from './helpers'

describe('formatDate', () => {
  it('returns - for null/undefined', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })
  it('formats a valid date', () => {
    const result = formatDate('2024-01-15')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })
})

describe('calculateAge', () => {
  it('returns null for null/invalid', () => {
    expect(calculateAge(null)).toBeNull()
    expect(calculateAge('invalid')).toBeNull()
  })
  it('returns a number for valid date', () => {
    const age = calculateAge('2000-01-01')
    expect(typeof age).toBe('number')
    expect(age).toBeGreaterThan(0)
  })
})

describe('validatePassword', () => {
  it('returns errors for weak password', () => {
    const errors = validatePassword('weak')
    expect(errors.length).toBeGreaterThan(0)
  })
  it('returns no errors for strong password', () => {
    const errors = validatePassword('Strong@123')
    expect(errors.length).toBe(0)
  })
})
