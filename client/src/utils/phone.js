export const phoneCountries = [
  ['ID', '62'], ['MY', '60'], ['SG', '65'], ['TH', '66'], ['VN', '84'],
  ['PH', '63'], ['BN', '673'], ['TL', '670'], ['AU', '61'], ['NZ', '64'],
  ['US', '1'], ['CA', '1'], ['GB', '44'], ['IN', '91'], ['CN', '86'],
  ['JP', '81'], ['KR', '82'], ['SA', '966'], ['AE', '971'], ['TR', '90'],
  ['DE', '49'], ['FR', '33'], ['NL', '31'], ['IT', '39'], ['ES', '34'],
  ['PT', '351'], ['BR', '55'], ['ZA', '27'],
].map(([region, code]) => ({ region, code }))

export function formatPhoneNumber(value, country) {
  const compact = value.trim().replace(/[\s().-]/g, '')
  if (!compact) return ''
  // Pasted international numbers already include their country code.
  if (compact.startsWith('+')) return compact
  if (compact.startsWith('00')) return '+' + compact.slice(2)
  // These countries use a domestic trunk zero that is omitted internationally.
  const trunkZero = ['ID', 'MY', 'TH', 'VN', 'PH', 'AU', 'NZ', 'GB', 'IN', 'CN', 'JP', 'KR', 'SA', 'AE', 'TR', 'DE', 'FR', 'NL', 'ZA']
  const national = trunkZero.includes(country.region) ? compact.replace(/^0/, '') : compact
  return '+' + country.code + national
}

export function isValidPhoneNumber(value) {
  return !value || /^\+[1-9]\d{6,14}$/.test(value)
}
