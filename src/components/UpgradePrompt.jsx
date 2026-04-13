import { useState } from 'react'
import { startCheckout } from '../utils/checkout.js'
import { getDeviceId } from '../utils/identity.js'
import { DialogBackdrop } from './DialogBackdrop.jsx'

export function UpgradePrompt({ onClose, feature, onRedeemed, authUser, onSignIn }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // Promo code state
  const [showCode, setShowCode]       = useState(false)
  const [codeValue, setCodeValue]     = useState('')
  const [codeEmail, setCodeEmail]     = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError]     = useState(null)
  const [codeSuccess, setCodeSuccess] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    const result = await startCheckout('premium_upgrade')
    if (!result.ok) {
      setError(result.error === 'Product not configured'
        ? 'Upgrade is not available yet — check back soon!'
        : result.error)
      setLoading(false)
    }
  }

  async function handleRedeem(e) {
    e.preventDefault()
    if (!codeValue.trim() || !codeEmail.trim()) return
    setCodeLoading(true)
    setCodeError(null)
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeValue.trim(),
          email: codeEmail.trim(),
          deviceId: getDeviceId(),
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setCodeSuccess(true)
        if (onRedeemed) onRedeemed()
      } else {
        setCodeError(data.error || 'Invalid code')
      }
    } catch {
      setCodeError('Something went wrong — try again')
    }
    setCodeLoading(false)
  }

  if (codeSuccess) {
    return (
      <DialogBackdrop onClose={onClose}>
        <div className="save-dialog upgrade-prompt">
          <p className="save-dialog-title">✦ Celestial Unlocked!</p>
          <p className="save-dialog-sub">
            All features are now yours. Welcome to the full cosmos.
          </p>
          <div className="save-dialog-btns">
            <button type="button" className="save-dialog-save upgrade-btn" onClick={onClose}>
              Let's Go
            </button>
          </div>
        </div>
      </DialogBackdrop>
    )
  }

  return (
    <DialogBackdrop onClose={onClose}>
      <div className="save-dialog upgrade-prompt">
        <p className="save-dialog-title">✦ Unlock Celestial</p>
        {feature ? (
          <p className="save-dialog-sub">
            <strong>{feature}</strong> is a Celestial feature. Upgrade to unlock it plus everything below.
          </p>
        ) : (
          <p className="save-dialog-sub">
            One upgrade, the full cosmos unlocked — for all your charts, forever.
          </p>
        )}

        <ul className="upgrade-features-list">
          <li>☉ <strong>Zodiac Wheel</strong> — map your family across the zodiac</li>
          <li>☽ <strong>Tables View</strong> — sortable sun, moon &amp; planet grid</li>
          <li>✦ <strong>Full Insights</strong> — compatibility, roles, zodiac threads, pluto generations</li>
          <li>✦ <strong>The Full DIG</strong> — every slide in your cosmic story</li>
          <li>🗂️ <strong>Unlimited Charts</strong> — save as many as you want</li>
        </ul>

        <div className="upgrade-price">
          <span className="upgrade-price-amount">$9.99</span>
          <span className="upgrade-price-label">one-time — yours forever</span>
        </div>

        {error && <p className="upgrade-error">{error}</p>}

        <div className="save-dialog-btns">
          <button type="button" className="save-dialog-cancel" onClick={onClose}>
            Maybe Later
          </button>
          {authUser ? (
            <button
              type="button"
              className="save-dialog-save upgrade-btn"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? 'Redirecting to checkout...' : '✦ Unlock Celestial — $9.99'}
            </button>
          ) : (
            <button
              type="button"
              className="save-dialog-save upgrade-btn"
              onClick={onSignIn}
            >
              Sign in to Unlock
            </button>
          )}
        </div>
        {!authUser && (
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.5rem', textAlign: 'center' }}>
            Sign in first so your purchase is tied to your account
          </p>
        )}

        {/* Promo code section */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
          {!showCode ? (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Have a gift code?
            </button>
          ) : (
            <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Your email"
                value={codeEmail}
                onChange={e => setCodeEmail(e.target.value)}
                required
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '6px', padding: '0.45rem 0.7rem', color: 'var(--text)',
                  fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Gift code"
                  value={codeValue}
                  onChange={e => setCodeValue(e.target.value)}
                  required
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px', padding: '0.45rem 0.7rem', color: 'var(--text)',
                    fontFamily: 'Raleway, sans-serif', fontSize: '0.8rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={codeLoading}
                  style={{
                    background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
                    borderRadius: '6px', padding: '0.45rem 0.8rem', color: 'var(--gold)',
                    fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', cursor: 'pointer',
                  }}
                >
                  {codeLoading ? '...' : 'Redeem'}
                </button>
              </div>
              {codeError && (
                <p style={{ fontSize: '0.75rem', color: '#e87070', margin: 0 }}>{codeError}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </DialogBackdrop>
  )
}
