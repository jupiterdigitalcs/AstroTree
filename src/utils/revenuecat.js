// RevenueCat In-App Purchase wrapper for the native (iOS) build.
//
// The website unlocks Celestial via Stripe (checkout.js). Apple forbids Stripe
// for digital unlocks, so the native app buys through StoreKit, brokered by
// RevenueCat. RevenueCat is the SAME $9.99 non-consumable, mapped to one
// entitlement ("celestial").
//
// Account mapping: we configure RevenueCat with appUserID = our deviceId, so
// RevenueCat's webhook (POST /api/revenuecat-webhook) arrives with
// app_user_id === deviceId and writes tier='premium' to the very same `devices`
// row the client reads back via refreshEntitlements(). That's why a purchase
// here unlocks everywhere the same account is signed in.
//
// The SDK is dynamically imported so the website bundle never pulls in the
// native plugin — every export below is a guarded no-op off-device.
import { isNativeApp } from './platform.js'
import { getDeviceId } from './identity.js'

// Must match the Entitlement identifier configured in the RevenueCat dashboard.
const ENTITLEMENT_ID = 'celestial'

// Public SDK key (Apple). Client-safe, like the Supabase anon key — injected at
// build time by vite.config.mobile.js. Empty on the website (isNativeApp false).
const API_KEY = process.env.NEXT_PUBLIC_REVENUECAT_IOS_KEY || ''

let _Purchases = null
let _configured = false

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ])
}

// Called from mobile/entry.jsx with a static import of the SDK so we never
// use a dynamic import at runtime (WKWebView + capacitor:// hangs on those).
// IMPORTANT: never pass _Purchases itself through Promise.resolve/race — the
// Capacitor plugin proxy intercepts .then access and routes it to native,
// making it look like an unresolvable thenable. Only pass method call results.
export function setRevenueCatSDK(sdk) { _Purchases = sdk }

// Configure RevenueCat once, on app launch. Safe to call anywhere.
export async function initRevenueCat() {
  if (!isNativeApp() || _configured) return
  if (!API_KEY) {
    console.warn('[rc] NEXT_PUBLIC_REVENUECAT_IOS_KEY not set — IAP disabled')
    return
  }
  if (!_Purchases) throw new Error('RevenueCat SDK not injected')
  await withTimeout(
    _Purchases.configure({ apiKey: API_KEY, appUserID: getDeviceId() }),
    8000,
    'Purchases.configure'
  )
  _configured = true
}

// True if the given customerInfo has the celestial entitlement active.
function isCelestialActive(customerInfo) {
  return typeof customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== 'undefined'
}

export async function purchaseCelestial() {
  if (!isNativeApp()) return { ok: false, error: 'In-app purchase is only available in the app' }
  if (!API_KEY) return { ok: false, error: 'RevenueCat key not configured — check env setup' }
  if (!_Purchases) return { ok: false, error: 'RevenueCat SDK not available' }
  try {
    await withTimeout(initRevenueCat(), 10000, 'RevenueCat init')
    if (!_configured) return { ok: false, error: 'RevenueCat init completed but not configured' }
    const offerings = await withTimeout(_Purchases.getOfferings(), 15000, 'getOfferings')
    const pkg = offerings?.current?.availablePackages?.[0]
    if (!pkg) return { ok: false, error: 'Celestial is not available yet — check back soon' }
    const { customerInfo } = await _Purchases.purchasePackage({ aPackage: pkg })
    return { ok: true, unlocked: isCelestialActive(customerInfo) }
  } catch (e) {
    if (e?.userCancelled || e?.code === '1' || /cancel/i.test(e?.message || '')) {
      return { ok: false, cancelled: true }
    }
    return { ok: false, error: e?.message || 'Purchase failed — please try again' }
  }
}

// Apple requires a "Restore Purchases" action for non-consumables (e.g. after a
// reinstall or on a new device with the same Apple ID).
export async function restorePurchases() {
  if (!isNativeApp()) return { ok: false, error: 'Restore is only available in the app' }
  if (!_Purchases) return { ok: false, error: 'RevenueCat SDK not available' }
  try {
    await initRevenueCat()
    if (!_configured) return { ok: false, error: 'Purchases are not available yet' }
    const { customerInfo } = await _Purchases.restorePurchases()
    return { ok: true, unlocked: isCelestialActive(customerInfo) }
  } catch (e) {
    return { ok: false, error: e?.message || 'Restore failed — please try again' }
  }
}
