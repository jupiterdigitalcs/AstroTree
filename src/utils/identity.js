import { kv } from './kvStore.js'
const KEY = 'astrotree_device_id'

// crypto.randomUUID only exists in secure contexts (HTTPS/localhost) and
// Safari 15.4+. The server validates device IDs as UUIDs (validate.js), so
// the fallback must produce the same format.
function makeUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// Fallback for private/incognito mode where localStorage is blocked
let _sessionId = null

export function getDeviceId() {
  try {
    let id = kv.get(KEY)
    if (!id) {
      id = makeUuid()
      kv.set(KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable — use a session-scoped ID for this page lifetime
    if (!_sessionId) _sessionId = makeUuid()
    return _sessionId
  }
}
