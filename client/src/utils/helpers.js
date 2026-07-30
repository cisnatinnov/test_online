export function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function calculateAge(birthdate) {
  if (!birthdate) return null
  const b = new Date(birthdate)
  if (isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email, t = (key) => key) {
  if (!email) return t('validation.emailRequired')
  if (!EMAIL_REGEX.test(email)) return t('validation.invalidEmail')
  return ''
}

export function validatePassword(pw, t = (key) => key) {
  const errors = []
  if (pw.length < 8) errors.push(t('validation.minChars'))
  if (!/[A-Z]/.test(pw)) errors.push(t('validation.uppercase'))
  if (!/[a-z]/.test(pw)) errors.push(t('validation.lowercase'))
  if (!/[0-9]/.test(pw)) errors.push(t('validation.digit'))
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) errors.push(t('validation.symbol'))
  return errors
}

const NIK_REGEX = /^\d{1,20}$/

export function validateName(name, t = (key) => key) {
  if (!name || !name.trim()) return t('validation.nameRequired')
  return ''
}

export function validateNik(nik, t = (key) => key) {
  if (!nik) return ''
  if (!NIK_REGEX.test(nik)) return t('validation.nikInvalid')
  return ''
}

export function validateHeight(height, t = (key) => key) {
  if (height === '' || height === null || height === undefined) return ''
  const h = Number(height)
  if (!Number.isFinite(h) || h < 1 || h > 300) return t('validation.heightInvalid')
  return ''
}

export function validateBirthdate(birthdate, t = (key) => key) {
  if (!birthdate) return ''
  const d = new Date(birthdate)
  if (isNaN(d.getTime())) return t('validation.birthdateInvalid')
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (d > today) return t('validation.birthdateInvalid')
  return ''
}

// The API stores health evaluation labels as canonical Indonesian strings.
// These translators map them to i18n keys so they follow the selected language,
// falling back to the raw value when the label is unknown.
const BMI_STATUS_KEYS = {
  'Sangat kurus': 'healthStatus.severelyUnderweight',
  'Kurus': 'healthStatus.underweight',
  'Normal': 'healthStatus.normal',
  'Gemuk': 'healthStatus.overweight',
  'Obesitas': 'healthStatus.obese',
}

const SUGAR_CONCLUSION_KEYS = {
  'Rendah': 'healthStatus.sugarLow',
  'Normal': 'healthStatus.normal',
  'Tinggi': 'healthStatus.sugarHigh',
  'Tidak ada': 'healthStatus.none',
}

const SUGAR_DESCRIPTION_KEYS = {
  'Kadar gula Anda rendah.': 'healthStatus.sugarLowDesc',
  'Kadar gula Anda normal.': 'healthStatus.sugarNormalDesc',
  'Kadar gula Anda tinggi.': 'healthStatus.sugarHighDesc',
}

function translateLabel(value, map, t) {
  if (!value) return ''
  const key = map[value]
  return key ? t(key) : value
}

export function translateBmiStatus(status, t = (key) => key) {
  return translateLabel(status, BMI_STATUS_KEYS, t)
}

export function translateSugarConclusion(conclusion, t = (key) => key) {
  return translateLabel(conclusion, SUGAR_CONCLUSION_KEYS, t)
}

export function translateSugarDescription(description, t = (key) => key) {
  return translateLabel(description, SUGAR_DESCRIPTION_KEYS, t)
}

export function passwordStrength(pw, t = (key) => key) {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++
  if (score <= 2) return { score, label: t('passwordStrength.weak'), color: '#e74c3c' }
  if (score <= 3) return { score, label: t('passwordStrength.medium'), color: '#f39c12' }
  return { score, label: t('passwordStrength.strong'), color: '#2ecc71' }
}