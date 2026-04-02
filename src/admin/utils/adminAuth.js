const SESSION_KEY = 'admin_authed'

export function isAdminAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function attemptAdminLogin(password) {
  if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, '1')
    return true
  }
  return false
}

export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY)
}
