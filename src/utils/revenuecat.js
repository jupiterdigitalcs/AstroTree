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

async function loadSDK() {
  if (_Purchases) return _Purchases
  const mod = await import('@revenuecat/purchases-capacitor')
  _Purchases = mod.Purchases
  return _Purchases
}

// Configure RevenueCat once, on app launch. Safe to call anywhere.
export async function initRevenueCat() {
  if (!isNativeApp() || _configured) return
  if (!API_KEY) {
    console.warn('[rc] NEXT_PUBLIC_REVENUECAT_IOS_KEY not set — IAP disabled')
    return
  }
  const Purchases = await loadSDK()
  await Purchases.configure({ apiKey: API_KEY, appUserID: getDeviceId() })
  _configured = true
}

// True if the given customerInfo has the celestial entitlement active.
function isCelestialActive(customerInfo) {
  return typeof customerInfo?.entitlements?.active?.[ENTITLEMENT_ID] !== 'undefined'
}

// Buy the Celestial unlock. Returns { ok, unlocked } on success,
// { ok: false, cancelled } if the user backed out, or { ok: false, error }.
export async function purchaseCelestial() {
  if (!isNativeApp()) return { ok: false, error: 'In-app purchase is only available in the app' }
  try {
    await initRevenueCat()
    if (!_configured) return { ok: false, error: 'Purchases are not available yet' }
    const Purchases = await loadSDK()
    const offerings = await Purchases.getOfferings()
    const pkg = offerings?.current?.availablePackages?.[0]
    if (!pkg) return { ok: false, error: 'Celestial is not available yet — check back soon' }
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    return { ok: true, unlocked: isCelestialActive(customerInfo) }
  } catch (e) {
    // RevenueCat sets userCancelled on the StoreKit cancel; never show an error for that.
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
  try {
    await initRevenueCat()
    if (!_configured) return { ok: false, error: 'Purchases are not available yet' }
    const Purchases = await loadSDK()
    const { customerInfo } = await Purchases.restorePurchases()
    return { ok: true, unlocked: isCelestialActive(customerInfo) }
  } catch (e) {
    return { ok: false, error: e?.message || 'Restore failed — please try again' }
  }
}
