// Single place the client learns whether it's running inside the native
// (Capacitor/iOS) app shell vs. the website. The native build appends
// "AstroDigApp" to the user agent (capacitor.config.json) and exposes a
// window.Capacitor global. Either signal means native.
//
// Why this matters: the App Store forbids Stripe checkout for digital
// unlocks, so the upgrade flow branches to In-App Purchase when isNativeApp()
// is true. See revenuecat.js.
export function isNativeApp() {
  if (typeof window === 'undefined') return false
  if (window.Capacitor?.isNativePlatform?.()) return true
  return /AstroDigApp/i.test(navigator.userAgent || '')
}
