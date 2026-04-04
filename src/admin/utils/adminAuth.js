const SESSION_KEY = 'admin_authed'
const TOKEN_KEY   = 'admin_token'

export function isAdminAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === '1' && !!sessionStorage.getItem(TOKEN_KEY)
}

export function getAdminToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

export async function attemptAdminLogin(password) {
  try {
    const res = await fetch('/api/admin?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (data.ok && data.token) {
      sessionStorage.setItem(SESSION_KEY, '1')
      sessionStorage.setItem(TOKEN_KEY, data.token)
      return true
    }
    return false
  } catch {
    return false
  }
}

export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
