import { describe, it, expect } from 'vitest'
import { formatDate, calculateAge, validatePassword, passwordStrength, validateName, validateNik, validateHeight, validateBirthdate, translateBmiStatus, translateSugarConclusion, translateSugarDescription } from './helpers'

const t = (key) => ({
  'validation.minChars': 'Minimum 8 characters',
  'validation.uppercase': 'At least 1 uppercase letter',
  'validation.lowercase': 'At least 1 lowercase letter',
  'validation.digit': 'At least 1 digit',
  'validation.symbol': 'At least 1 symbol',
  'validation.nameRequired': 'Name is required',
  'validation.nikInvalid': 'NIK must contain 1-20 digits',
  'validation.heightInvalid': 'Height must be between 1 and 300 cm',
  'validation.birthdateInvalid': 'Birthdate is invalid',
  'healthStatus.severelyUnderweight': 'Severely underweight',
  'healthStatus.underweight': 'Underweight',
  'healthStatus.normal': 'Normal',
  'healthStatus.overweight': 'Overweight',
  'healthStatus.obese': 'Obese',
  'healthStatus.sugarLow': 'Low',
  'healthStatus.sugarHigh': 'High',
  'healthStatus.none': 'None',
  'healthStatus.sugarLowDesc': 'Your blood sugar is low.',
  'healthStatus.sugarNormalDesc': 'Your blood sugar is normal.',
  'healthStatus.sugarHighDesc': 'Your blood sugar is high.',
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

describe('validateName', () => {
  it('returns error for empty or blank name', () => {
    expect(validateName('', t)).toBe('Name is required')
    expect(validateName('   ', t)).toBe('Name is required')
  })
  it('returns no error for a valid name', () => {
    expect(validateName('John Doe', t)).toBe('')
  })
})

describe('validateNik', () => {
  it('returns no error when empty (optional)', () => {
    expect(validateNik('', t)).toBe('')
  })
  it('returns no error for digits up to 20 chars', () => {
    expect(validateNik('1234567890123456', t)).toBe('')
  })
  it('returns error for non-digits or too long', () => {
    expect(validateNik('12ab', t)).toBe('NIK must contain 1-20 digits')
    expect(validateNik('123456789012345678901', t)).toBe('NIK must contain 1-20 digits')
  })
})

describe('validateHeight', () => {
  it('returns no error when empty (optional)', () => {
    expect(validateHeight('', t)).toBe('')
  })
  it('returns no error for height within range', () => {
    expect(validateHeight(170, t)).toBe('')
  })
  it('returns error for out-of-range or non-numeric height', () => {
    expect(validateHeight(0, t)).toBe('Height must be between 1 and 300 cm')
    expect(validateHeight(301, t)).toBe('Height must be between 1 and 300 cm')
    expect(validateHeight('abc', t)).toBe('Height must be between 1 and 300 cm')
  })
})

describe('validateBirthdate', () => {
  it('returns no error when empty (optional)', () => {
    expect(validateBirthdate('', t)).toBe('')
  })
  it('returns no error for a past date', () => {
    expect(validateBirthdate('2000-01-01', t)).toBe('')
  })
  it('returns error for invalid or future dates', () => {
    expect(validateBirthdate('not-a-date', t)).toBe('Birthdate is invalid')
    expect(validateBirthdate('2999-01-01', t)).toBe('Birthdate is invalid')
  })
})

describe('translateBmiStatus', () => {
  it('translates known Indonesian BMI statuses', () => {
    expect(translateBmiStatus('Sangat kurus', t)).toBe('Severely underweight')
    expect(translateBmiStatus('Kurus', t)).toBe('Underweight')
    expect(translateBmiStatus('Normal', t)).toBe('Normal')
    expect(translateBmiStatus('Gemuk', t)).toBe('Overweight')
    expect(translateBmiStatus('Obesitas', t)).toBe('Obese')
  })
  it('falls back to raw value for unknown status and empty for falsy', () => {
    expect(translateBmiStatus('Custom', t)).toBe('Custom')
    expect(translateBmiStatus('', t)).toBe('')
    expect(translateBmiStatus(null, t)).toBe('')
  })
})

describe('translateSugarConclusion', () => {
  it('translates known conclusions', () => {
    expect(translateSugarConclusion('Rendah', t)).toBe('Low')
    expect(translateSugarConclusion('Normal', t)).toBe('Normal')
    expect(translateSugarConclusion('Tinggi', t)).toBe('High')
    expect(translateSugarConclusion('Tidak ada', t)).toBe('None')
  })
  it('falls back to raw value for unknown conclusion', () => {
    expect(translateSugarConclusion('???', t)).toBe('???')
  })
})

describe('translateSugarDescription', () => {
  it('translates known descriptions', () => {
    expect(translateSugarDescription('Kadar gula Anda rendah.', t)).toBe('Your blood sugar is low.')
    expect(translateSugarDescription('Kadar gula Anda normal.', t)).toBe('Your blood sugar is normal.')
    expect(translateSugarDescription('Kadar gula Anda tinggi.', t)).toBe('Your blood sugar is high.')
  })
  it('falls back to raw value for unknown description and empty for falsy', () => {
    expect(translateSugarDescription('Other text', t)).toBe('Other text')
    expect(translateSugarDescription('', t)).toBe('')
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
