// Native (iOS) sign-in for the Capacitor build.
//
// Google blocks its OAuth JS (GSI) inside embedded WebViews, so the web
// initGoogleButton flow in useAuth cannot work in the app. Here we use native
// sheets via @capgo/capacitor-social-login (one plugin, Google + Apple, the
// only option that supports Capacitor 8). Each returns an OpenID idToken that
// we hand to Supabase's signInWithIdToken — the SAME server-side path the web
// GSI flow already uses, so no new auth backend is needed.
//
// Sign in with Apple is also an App Review requirement (guideline 4.8) because
// the app offers Google as a third-party login.
//
// The plugin is dynamically imported and every call is guarded by isNativeApp()
// so the website bundle never loads or invokes it.
import { isNativeApp } from './platform.js'

// iOS OAuth client (Google Cloud Console) + the existing web client. Setting
// iOSServerClientId to the web client makes the returned idToken's audience the
// web client, which Supabase's Google provider already trusts (same id the
// website uses). See IOS_AUTH_SETUP.md.
const GOOGLE_IOS_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
const GOOGLE_WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
// Apple verifies the token audience against the app's bundle id; Supabase's
// Apple provider must list this id as an allowed client id.
const APPLE_CLIENT_ID = 'com.jupiterdigital.astrodigios'

let _SocialLogin = null
let _initialized = false

async function load() {
  if (_SocialLogin) return _SocialLogin
  const mod = await import('@capgo/capacitor-social-login')
  _SocialLogin = mod.SocialLogin
  return _SocialLogin
}

// Configure the plugin once. Safe to call repeatedly / off-device (no-op).
export async function initNativeAuth() {
  if (!isNativeApp() || _initialized) return
  const SocialLogin = await load()
  await SocialLogin.initialize({
    google: { iOSClientId: GOOGLE_IOS_CLIENT_ID, iOSServerClientId: GOOGLE_WEB_CLIENT_ID, mode: 'online' },
    apple: { clientId: APPLE_CLIENT_ID },
  })
  _initialized = true
}

function cancelled(e) {
  return e?.code === 'CANCELLED' || /cancel/i.test(e?.message || '')
}

function generateNonce() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256hex(str) {
  const data = new TextEncoder().encode(str)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('')
}

// Returns { ok, token, nonce } with a Google OpenID idToken.
//
// Nonce flow (mirrors Supabase's Apple Sign In convention):
//   1. rawNonce  → passed to Supabase's signInWithIdToken
//   2. hashedNonce (SHA256 of raw) → passed to GIDSignIn, embedded in JWT
//   3. GoTrue SHA256s rawNonce and compares with hashedNonce in JWT → match
//
// forcePrompt: true → Swift sets forceAuthCode=true, bypassing the
// restorePreviousSignIn path that would skip embedding the nonce.
export async function nativeGoogleToken() {
  if (!isNativeApp()) return { ok: false, error: 'Native sign-in only' }
  try {
    await initNativeAuth()
    const SocialLogin = await load()
    const rawNonce = generateNonce()
    const hashedNonce = await sha256hex(rawNonce)
    const res = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'], nonce: hashedNonce, forcePrompt: true } })
    const token = res?.result?.idToken
    if (!token) return { ok: false, error: 'No Google token returned' }
    return { ok: true, token, nonce: rawNonce }
  } catch (e) {
    if (cancelled(e)) return { ok: false, cancelled: true }
    return { ok: false, error: e?.message || 'Google sign-in failed' }
  }
}

// Returns { ok, token } with an Apple identity token.
export async function nativeAppleToken() {
  if (!isNativeApp()) return { ok: false, error: 'Native sign-in only' }
  try {
    await initNativeAuth()
    const SocialLogin = await load()
    const res = await SocialLogin.login({ provider: 'apple', options: { scopes: ['email', 'name'] } })
    const token = res?.result?.idToken
    if (!token) return { ok: false, error: 'No Apple token returned' }
    return { ok: true, token }
  } catch (e) {
    if (cancelled(e)) return { ok: false, cancelled: true }
    return { ok: false, error: e?.message || 'Apple sign-in failed' }
  }
}
