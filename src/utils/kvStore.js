// All persistent client storage goes through here so a future native (iOS)
// build can swap localStorage for a platform store (e.g. Capacitor
// Preferences) in one place. WKWebView localStorage is evictable by the OS,
// so drafts and the device identity need real persistence there.
//
// Same synchronous contract as localStorage, but never throws (private
// browsing, storage disabled, quota).

export const kv = {
  get(key) {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key, value) {
    try { localStorage.setItem(key, value) } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch {}
  },
}
