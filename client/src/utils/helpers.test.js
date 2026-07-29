import { describe, it, expect } from 'vitest'
import { formatDate, calculateAge, validatePassword, passwordStrength } from './helpers'

const t = (key) => ({
  'validation.minChars': 'Minimum 8 characters',
  'validation.uppercase': 'At least 1 uppercase letter',
  'validation.lowercase': 'At least 1 lowercase letter',
  'validation.digit': 'At least 1 digit',
  'validation.symbol': 'At least 1 symbol',
  'passwordStrength.weak': 'Weak',
  'passwordStrength.medium': 'Medium',
  'passwordStrength.strong': 'Strong',
}[key] || key)

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
    const errors = validatePassword('weak', t)
    expect(errors).toContain('Minimum 8 characters')
    expect(errors.length).toBeGreaterThan(0)
  })
  it('returns no errors for strong password', () => {
    const errors = validatePassword('Strong@123', t)
    expect(errors.length).toBe(0)
  })
})

describe('passwordStrength', () => {
  it('returns a weak label for weak passwords', () => {
    const result = passwordStrength('weak', t)
    expect(result.label).toBe('Weak')
    expect(result.color).toBe('#e74c3c')
  })
  it('returns a strong label for strong passwords', () => {
    const result = passwordStrength('Strong@123', t)
    expect(result.label).toBe('Strong')
    expect(result.color).toBe('#2ecc71')
  })
})
