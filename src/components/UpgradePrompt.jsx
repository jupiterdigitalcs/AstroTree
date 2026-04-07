import { useState } from 'react'
import { startCheckout } from '../utils/checkout.js'

export function UpgradePrompt({ onClose, feature }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

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
    // If ok, user is being redirected to Stripe — keep loading state
  }

  return (
    <div className="save-dialog-backdrop" onClick={onClose}>
      <div className="save-dialog upgrade-prompt" onClick={e => e.stopPropagation()}>
        <p className="save-dialog-title">Unlock Premium</p>
        <p className="save-dialog-sub">
          {feature
            ? `This feature requires a premium upgrade.`
            : `Upgrade to unlock all features and unlimited charts.`
          }
        </p>

        <ul className="upgrade-features-list">
          <li>Unlimited saved charts</li>
          <li>Premium PDF export</li>
          <li>Advanced insights</li>
          <li>All future features</li>
        </ul>

        {error && <p className="upgrade-error">{error}</p>}

        <div className="save-dialog-btns">
          <button type="button" className="save-dialog-cancel" onClick={onClose}>
            Maybe Later
          </button>
          <button
            type="button"
            className="save-dialog-save upgrade-btn"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'Redirecting...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  )
}
