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

export function validateEmail(email) {
  if (!email) return 'Email harus diisi'
  if (!EMAIL_REGEX.test(email)) return 'Format email tidak valid'
  return ''
}

export function validatePassword(pw) {
  const errors = []
  if (pw.length < 8) errors.push('Minimal 8 karakter')
  if (!/[A-Z]/.test(pw)) errors.push('Minimal 1 huruf kapital')
  if (!/[a-z]/.test(pw)) errors.push('Minimal 1 huruf kecil')
  if (!/[0-9]/.test(pw)) errors.push('Minimal 1 angka')
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) errors.push('Minimal 1 simbol')
  return errors
}

export function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++
  if (score <= 2) return { score, label: 'Lemah', color: '#e74c3c' }
  if (score <= 3) return { score, label: 'Sedang', color: '#f39c12' }
  return { score, label: 'Kuat', color: '#2ecc71' }
}
