import { useState } from 'react'
import { DialogBackdrop } from './DialogBackdrop.jsx'

const PROMPT_KEY = 'astrotree_auth_prompt'
const EMAIL_KEY  = 'astrotree_user_email'
const ASKED_KEY  = 'astrotree_email_asked'

function getPromptState() {
  try {
    const raw = localStorage.getItem(PROMPT_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  try {
    if (localStorage.getItem(ASKED_KEY) === '1') {
      return { dismissCount: 1, lastDismissed: new Date().toISOString() }
    }
  } catch {}
  return { dismissCount: 0, lastDismissed: null }
}

function savePromptState(state) {
  try {
    localStorage.setItem(PROMPT_KEY, JSON.stringify(state))
    localStorage.setItem(ASKED_KEY, '1')
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
      const charts = JSON.parse(localStorage.getItem('astrotree_charts') || '[]')
      if (daysSince >= 7 && charts.length >= 3) return false
    } catch {}
  }
  return true
}

export function shouldForcePrompt() {
  return !getSavedEmail()
}

export function getSavedEmail() {
  try { return localStorage.getItem(EMAIL_KEY) ?? null } catch { return null }
}

export function clearEmailAsked() {
  try {
    localStorage.removeItem(PROMPT_KEY)
    localStorage.removeItem(ASKED_KEY)
  } catch {}
}

export function isAtRisk() {
  if (getSavedEmail()) return false
  try {
    const charts = JSON.parse(localStorage.getItem('astrotree_charts') || '[]')
    return charts.length > 0
  } catch { return false }
}

export function EmailCapture({ onDismiss, signInWithGoogle, signInWithEmail, variant }) {
  const [showEmailFallback, setShowEmailFallback] = useState(false)
  const [email,      setEmail]      = useState('')
  const [status,     setStatus]     = useState('idle') // idle | submitting | sent | error
  const [emailError, setEmailError] = useState('')
  const [errorMsg,   setErrorMsg]   = useState('')

  const isPostPurchase = variant === 'post-purchase'

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
      setErrorMsg(result.error || 'Could not connect to Google — try again')
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
      try { localStorage.setItem(EMAIL_KEY, email.trim()) } catch {}
      setStatus('sent')
    } else {
      setErrorMsg(result.error || 'Something went wrong — try again')
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
            ? 'Sign in so you can access Celestial from any device — or get it back if you switch browsers.'
            : 'Sign in so your charts follow you everywhere — new phone, new browser, always yours.'}
        </p>

        {/* Primary: Google Sign-In */}
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
