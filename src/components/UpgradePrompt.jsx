import { useState, useEffect } from 'react'
import { startCheckout } from '../utils/checkout.js'
import { isNativeApp } from '../utils/platform.js'
import { purchaseCelestial, restorePurchases } from '../utils/revenuecat.js'
import { getDeviceId } from '../utils/identity.js'
import { logEvent } from '../utils/cloudStorage.js'
import { DialogBackdrop } from './DialogBackdrop.jsx'
import { apiUrl } from '../utils/apiBase.js'

export function UpgradePrompt({ onClose, feature, onRedeemed, authUser, onSignIn }) {
  const native = isNativeApp()
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => { logEvent('paywall_hit') }, [])
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

    // Native (iOS): buy through StoreKit via RevenueCat. Apple forbids Stripe
    // for digital unlocks. The purchase binds to deviceId, so the RevenueCat
    // webhook writes premium to the same `devices` row refreshEntitlements reads.
    if (native) {
      const result = await purchaseCelestial()
      if (result.ok && result.unlocked) {
        if (onRedeemed) onRedeemed()
        setCodeSuccess(true)
      } else if (!result.cancelled) {
        setError(result.error || 'Purchase failed — please try again')
      }
      setLoading(false)
      return
    }

    const result = await startCheckout('premium_upgrade')
    if (!result.ok) {
      setError(result.error === 'Product not configured'
        ? 'Upgrade is not available yet — check back soon!'
        : result.error)
      setLoading(false)
    }
  }

  // Apple requires a Restore Purchases path for non-consumables (reinstall, new device).
  async function handleRestore() {
    setRestoring(true)
    setError(null)
    const result = await restorePurchases()
    if (result.ok && result.unlocked) {
      if (onRedeemed) onRedeemed()
      setCodeSuccess(true)
    } else if (result.ok) {
      setError('No previous purchase found to restore.')
    } else {
      setError(result.error || 'Restore failed — please try again')
    }
    setRestoring(false)
  }

  async function handleRedeem(e) {
    e.preventDefault()
    if (!codeValue.trim() || !authUser?.email) return
    setCodeLoading(true)
    setCodeError(null)
    try {
      const res = await fetch(apiUrl('/api/redeem'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeValue.trim(),
          email: authUser.email,
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
        <div className="save-dialog upgrade-prompt" role="dialog" aria-modal="true" aria-label="Celestial unlocked">
          <p className="save-dialog-title">✦ Celestial Unlocked!</p>
          <p className="save-dialog-sub">
            All Celestial features are now yours. Welcome in.
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
      <div className="save-dialog upgrade-prompt" role="dialog" aria-modal="true" aria-label="Unlock Celestial">
        <p className="save-dialog-title">✦ Unlock Celestial</p>
        {feature ? (
          <p className="save-dialog-sub">
            <strong>{feature}</strong> is a Celestial feature. Upgrade to unlock it plus everything below.
          </p>
        ) : (
          <p className="save-dialog-sub">
            One upgrade unlocks Celestial for all your charts, forever.
          </p>
        )}

        <ul className="upgrade-features-list">
          <li>☉ <strong>Extra Views</strong> · zodiac wheel, tables, and more</li>
          <li>✦ <strong>Full Insights</strong> · roles, zodiac threads, and deeper analysis</li>
          <li>✦ <strong>The Current</strong> · what the sky is doing to your whole group right now</li>
          <li>✦ <strong>The Full DIG</strong> · every slide in your cosmic story</li>
          <li>🗂️ <strong>More Charts</strong> · save and manage more charts</li>
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
          {(authUser || native) ? (
            <button
              type="button"
              className="save-dialog-save upgrade-btn"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading
                ? (native ? 'Processing...' : 'Redirecting to checkout...')
                : '✦ Unlock Celestial — $9.99'}
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
        {native && (
          <button
            type="button"
            onClick={handleRestore}
            disabled={restoring}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.6rem', display: 'block', marginInline: 'auto' }}
          >
            {restoring ? 'Restoring...' : 'Restore purchase'}
          </button>
        )}
        {!authUser && !native && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.5rem', textAlign: 'center' }}>
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
          ) : !authUser ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>Sign in first to redeem a gift code</p>
              <button
                type="button"
                onClick={onSignIn}
                style={{
                  background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
                  borderRadius: '6px', padding: '0.45rem 0.8rem', color: 'var(--gold)',
                  fontFamily: 'Raleway, sans-serif', fontSize: '0.78rem', cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
