const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email)
  return normalized.length <= 254 && emailPattern.test(normalized)
}

export function validateName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 120
}

export function validatePhone(phone) {
  if (typeof phone !== 'string' || phone.length > 24 || !/^[\d+(). -]+$/.test(phone.trim())) {
    return false
  }
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

export function validatePassword(password) {
  return typeof password === 'string'
    && password.length >= 8
    && Buffer.byteLength(password, 'utf8') <= 72
}
