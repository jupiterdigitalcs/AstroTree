import { useState, useRef, useEffect } from 'react'
import { DialogBackdrop } from './DialogBackdrop.jsx'
import { kv } from '../utils/kvStore.js'
import { isNativeApp } from '../utils/platform.js'

const PROMPT_KEY = 'astrotree_auth_prompt'
const EMAIL_KEY  = 'astrotree_user_email'
const ASKED_KEY  = 'astrotree_email_asked'

function getPromptState() {
  try {
    const raw = kv.get(PROMPT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  try {
    if (kv.get(ASKED_KEY) === '1') {
      return { dismissCount: 1, lastDismissed: new Date().toISOString() }
    }
  } catch {}
  return { dismissCount: 0, lastDismissed: null }
}

function savePromptState(state) {
  try {
    kv.set(PROMPT_KEY, JSON.stringify(state))
    kv.set(ASKED_KEY, '1')
  } catch {}
}

export function hasBeenAsked() {
  if (getSavedEmail()) return true
  const state = getPromptState()
  if (state.dismissCount === 0) return false
  if (state.dismissCount >= 2) return true
  if (state.dismissCount === 1 && state.lastDismissed) {
    const daysSince = (Date.now() - new Date(state.lastDismissed).getTime()) / (1000 * 60 * 60 * 24)
    try {
      const charts = JSON.parse(kv.get('astrotree_charts') || '[]')
      if (daysSince >= 7 && charts.length >= 3) return false
    } catch {}
  }
  return true
}

export function shouldForcePrompt() {
  return !getSavedEmail()
}

export function getSavedEmail() {
  try { return kv.get(EMAIL_KEY) ?? null } catch { return null }
}

export function clearEmailAsked() {
  try {
    kv.remove(PROMPT_KEY)
    kv.remove(ASKED_KEY)
  } catch {}
}

export function isAtRisk() {
  if (getSavedEmail()) return false
  try {
    const charts = JSON.parse(kv.get('astrotree_charts') || '[]')
    return charts.length > 0
  } catch { return false }
}

export function EmailCapture({ onDismiss, signInWithGoogle, signInWithEmail, initGoogleButton, signInWithGoogleNative, signInWithAppleNative, variant }) {
  const [showEmailFallback, setShowEmailFallback] = useState(false)
  const [email,      setEmail]      = useState('')
  const [status,     setStatus]     = useState('idle') // idle | submitting | sent | error
  const [emailError, setEmailError] = useState('')
  const [errorMsg,   setErrorMsg]   = useState('')
  const googleBtnRef = useRef(null)
  const [gsiReady, setGsiReady] = useState(false)

  const isPostPurchase = variant === 'post-purchase'
  // In the iOS app, Google's web GSI button is blocked inside the WebView, so
  // we show native sheets (Apple + Google) instead. See nativeAuth.js.
  const native = isNativeApp()

  // Render Google's native sign-in button (web only).
  // On mobile web, GSI uses redirect mode (login_uri) instead of popup mode,
  // so the button works the same way but the redirect is handled server-side.
  useEffect(() => {
    if (native) return // native app uses the Capacitor sheets, not the web GSI button
    if (!initGoogleButton || !googleBtnRef.current) return
    initGoogleButton(googleBtnRef.current, (result) => {
      if (!result.ok) {
        setErrorMsg(result.error || 'Could not sign in with Google')
        setStatus('idle')
      }
    })
    // Check if GSI actually rendered a button (may take a moment)
    const check = setInterval(() => {
      if (googleBtnRef.current?.querySelector('iframe, div[role="button"]')) {
        setGsiReady(true)
        clearInterval(check)
      }
    }, 200)
    const timeout = setTimeout(() => { clearInterval(check) }, 5000)
    return () => { clearInterval(check); clearTimeout(timeout) }
  }, [initGoogleButton, native])

  // Native (iOS) sign-in via Capacitor sheets. On success, onAuthStateChange
  // links the device and the parent closes this dialog.
  async function handleNative(fn, label) {
    setStatus('submitting')
    setErrorMsg('')
    const result = await fn()
    if (!result.ok && !result.cancelled) {
      setErrorMsg(result.error || `Could not sign in with ${label}`)
    }
    if (!result.ok) setStatus('idle')
  }

  function handleDismiss() {
    const state = getPromptState()
    savePromptState({ ...state, dismissCount: state.dismissCount + 1, lastDismissed: new Date().toISOString() })
    onDismiss()
  }

  async function handleGoogle() {
    setStatus('submitting')
    setErrorMsg('')
    const result = await signInWithGoogle()
    if (!result.ok) {
      setErrorMsg(result.error || 'Could not connect to Google, try again')
      setStatus('idle')
    }
    // If ok, the page redirects to Google → callback → onAuthStateChange handles the rest
  }

  function validateEmail(val) {
    if (!val.trim()) return 'Enter your email address'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Enter a valid email address'
    return ''
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }
    setStatus('submitting')
    setErrorMsg('')
    const result = await signInWithEmail(email.trim())
    if (result.ok) {
      try { kv.set(EMAIL_KEY, email.trim()) } catch {}
      setStatus('sent')
    } else {
      setErrorMsg(result.error || 'Something went wrong, try again')
      setStatus('idle')
    }
  }

  // Magic link sent confirmation
  if (status === 'sent') {
    return (
      <DialogBackdrop onClose={onDismiss}>
        <div className="email-capture">
          <p className="email-capture-title">✦ Check your email</p>
          <p className="email-capture-sub">
            We sent a sign-in link to <strong>{email}</strong>. Click it to connect your account.
          </p>
          <p className="email-capture-sub" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Look for a message from <strong>Supabase</strong> or <strong>AstroDig</strong>. Check spam if you don't see it within a minute.
          </p>
          <div className="save-dialog-btns">
            <button type="button" className="save-dialog-save" onClick={onDismiss}>Got it</button>
          </div>
        </div>
      </DialogBackdrop>
    )
  }

  return (
    <DialogBackdrop onClose={handleDismiss}>
      <div className="email-capture">
        <p className="email-capture-title">
          {isPostPurchase ? '✦ Your Celestial upgrade is active!' : '✦ Save your cosmic connections'}
        </p>
        <p className="email-capture-sub">
          {isPostPurchase
            ? 'Sign in so you can access Celestial from any device, or get it back if you switch browsers.'
            : 'Sign in so your charts follow you everywhere: new phone, new browser, always yours.'}
        </p>

        {native ? (
          <>
            {/* iOS: Sign in with Apple first (App Review 4.8 — must be at least
                as prominent as other providers), then native Google. */}
            <button
              type="button"
              className="auth-apple-btn"
              onClick={() => handleNative(signInWithAppleNative, 'Apple')}
              disabled={status === 'submitting'}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.05 12.6c-.03-2.7 2.2-4 2.3-4.06-1.25-1.83-3.2-2.08-3.9-2.11-1.66-.17-3.24.97-4.08.97-.84 0-2.14-.95-3.52-.92-1.81.03-3.48 1.05-4.41 2.67-1.88 3.27-.48 8.1 1.35 10.76.9 1.3 1.97 2.76 3.38 2.71 1.36-.05 1.87-.88 3.51-.88 1.64 0 2.1.88 3.53.85 1.46-.03 2.38-1.33 3.27-2.64 1.03-1.51 1.46-2.98 1.48-3.05-.03-.01-2.84-1.09-2.87-4.32-.02-2.7 0 0 0 0zM14.4 4.6c.74-.9 1.24-2.15 1.1-3.4-1.07.04-2.36.71-3.13 1.61-.69.79-1.29 2.06-1.13 3.27 1.19.09 2.42-.6 3.16-1.48z"/>
              </svg>
              {status === 'submitting' ? 'Signing in...' : 'Sign in with Apple'}
            </button>
            <button
              type="button"
              className="auth-google-btn"
              onClick={() => handleNative(signInWithGoogleNative, 'Google')}
              disabled={status === 'submitting'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {status === 'submitting' ? 'Signing in...' : 'Continue with Google'}
            </button>
          </>
        ) : (
          <>
            {/* Web: Google Sign-In (native GSI button — popup on desktop, redirect on mobile) */}
            <div ref={googleBtnRef} className="auth-google-gsi" style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }} />
            {/* Fallback if GSI doesn't load */}
            {!gsiReady && (
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogle}
                disabled={status === 'submitting'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {status === 'submitting' ? 'Connecting...' : 'Continue with Google'}
              </button>
            )}
          </>
        )}

        {errorMsg && <p className="email-capture-error">{errorMsg}</p>}

        {/* Fallback: email magic link */}
        {!showEmailFallback ? (
          <button
            type="button"
            className="auth-email-toggle"
            onClick={() => setShowEmailFallback(true)}
          >
            Or use email instead
          </button>
        ) : (
          <form onSubmit={handleEmailSubmit} noValidate className="auth-email-form">
            <input
              type="email"
              className={`save-dialog-input${emailError ? ' input--error' : ''}`}
              placeholder="your@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError('') }}
              autoFocus
              disabled={status === 'submitting'}
            />
            {emailError && <p className="email-capture-error">{emailError}</p>}
            <button
              type="submit"
              className="save-dialog-save"
              disabled={status === 'submitting'}
              style={{ width: '100%' }}
            >
              {status === 'submitting' ? 'Sending...' : 'Send sign-in link'}
            </button>
          </form>
        )}

        <button type="button" className="auth-skip-btn" onClick={handleDismiss}>
          Maybe later
        </button>

        <p className="email-capture-note">
          Plus occasional cosmic updates from Jupiter Digital.
        </p>
      </div>
    </DialogBackdrop>
  )
}
