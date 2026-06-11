import { kv } from './kvStore.js'
const KEY = 'astrotree_device_id'

// Fallback for private/incognito mode where localStorage is blocked
let _sessionId = null

export function getDeviceId() {
  try {
    let id = kv.get(KEY)
    if (!id) {
      id = crypto.randomUUID()
      kv.set(KEY, id)
    }
    return id
  } catch {
    // localStorage unavailable — use a session-scoped ID for this page lifetime
    if (!_sessionId) _sessionId = crypto.randomUUID()
    return _sessionId
  }
}
