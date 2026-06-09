// Shared input validation for API routes.

// Device IDs are always crypto.randomUUID() (see src/utils/identity.js)
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidDeviceId(id) {
  return typeof id === 'string' && UUID_RE.test(id)
}

export function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 254 && EMAIL_RE.test(email.trim())
}
