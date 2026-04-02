import { useState } from 'react'
import { updateDeviceEmail } from '../utils/cloudStorage.js'

const ASKED_KEY = 'astrotree_email_asked'
const EMAIL_KEY = 'astrotree_user_email'

export function hasBeenAsked() {
  try { return localStorage.getItem(ASKED_KEY) === '1' } catch { return true }
}

export function getSavedEmail() {
  try { return localStorage.getItem(EMAIL_KEY) ?? null } catch { return null }
}

function markAsked() {
  try { localStorage.setItem(ASKED_KEY, '1') } catch {}
}

function saveEmailLocally(email) {
  try { localStorage.setItem(EMAIL_KEY, email.trim()) } catch {}
}

export function EmailCapture({ onDismiss }) {
  const [email,     setEmail]     = useState('')
  const [status,    setStatus]    = useState('idle') // idle | submitting | done | error
  const [emailError, setEmailError] = useState('')

  function validate(val) {
    if (!val.trim()) return 'Enter your email address'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Enter a valid email address'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(email)
    if (err) { setEmailError(err); return }
    setStatus('submitting')
    const result = await updateDeviceEmail(email)
    markAsked()
    if (result.ok) saveEmailLocally(email)
    setStatus(result.ok ? 'done' : 'error')
  }

  function handleDismiss() {
    markAsked()
    onDismiss()
  }

  return (
    <div className="save-dialog-backdrop" onClick={handleDismiss}>
      <div className="email-capture" onClick={e => e.stopPropagation()}>
        {status === 'done' ? (
          <>
            <p className="email-capture-title">You're in! ✨</p>
            <p className="email-capture-sub">We'll let you know when new features ship.</p>
            <button type="button" className="save-dialog-save" onClick={onDismiss}>Done</button>
          </>
        ) : (
          <>
            <p className="email-capture-title">Want to know when new features ship?</p>
            <p className="email-capture-sub">
              Drop your email — no spam, just occasional updates from Jupiter Digital.
            </p>
            <form onSubmit={handleSubmit} noValidate>
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
              {status === 'error' && (
                <p className="email-capture-error">Something went wrong — try again later.</p>
              )}
              <div className="save-dialog-btns">
                <button type="button" className="save-dialog-cancel" onClick={handleDismiss}>
                  No thanks
                </button>
                <button
                  type="submit"
                  className="save-dialog-save"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Saving…' : 'Keep me updated'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
