import { describe, expect, it } from 'vitest'
import { phoneCountries, formatPhoneNumber, isValidPhoneNumber } from './phone'
const country = region => phoneCountries.find(item => item.region === region)
describe('international phone numbers', () => {
  it('converts an Indonesian domestic number without duplicating the trunk zero', () => {
    expect(formatPhoneNumber('0812 3456-7890', country('ID'))).toBe('+6281234567890')
  })
  it('formats another country and preserves significant Italian zeros', () => {
    expect(formatPhoneNumber('07700 900123', country('GB'))).toBe('+447700900123')
    expect(formatPhoneNumber('06 12345678', country('IT'))).toBe('+390612345678')
  })
  it('accepts pasted international and 00-prefixed numbers without adding the selected code twice', () => {
    expect(formatPhoneNumber('+65 8123 4567', country('ID'))).toBe('+6581234567')
    expect(formatPhoneNumber('0065 8123 4567', country('ID'))).toBe('+6581234567')
  })
  it('keeps the optional phone empty', () => {
    expect(formatPhoneNumber('', country('ID'))).toBe('')
    expect(isValidPhoneNumber('')).toBe(true)
  })
  it.each(['+62abc12345', '081234567890', '+123', '+1234567890123456', '+00123456789'])('rejects malformed number %s', value => {
    expect(isValidPhoneNumber(value)).toBe(false)
  })
})
