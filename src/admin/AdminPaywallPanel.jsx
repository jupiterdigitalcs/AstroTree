import { useState, useEffect } from 'react'
import { fetchPaywallConfig, updatePaywallConfig, fetchPurchases } from './utils/adminStorage.js'
import { FEATURE_KEYS } from '../utils/entitlements.js'

export default function AdminPaywallPanel() {
  const [config,    setConfig]    = useState(null)
  const [purchases, setPurchases] = useState([])
  const [saving,    setSaving]    = useState(null) // key being saved
  const [newProduct, setNewProduct] = useState({ key: '', name: '', stripePriceId: '', amountCents: '' })

  useEffect(() => {
    fetchPaywallConfig().then(c => { if (c && typeof c === 'object') setConfig(c) })
    fetchPurchases().then(setPurchases)
  }, [])

  if (!config) return <p style={{ padding: '1rem', opacity: 0.5 }}>Loading paywall config...</p>

  async function save(key, value) {
    setSaving(key)
    await updatePaywallConfig(key, value)
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaving(null)
  }

  const paywallEnabled   = config.paywall_enabled === true
  const gatedFeatures    = config.gated_features ?? []
  const products         = config.products ?? []
  const chartLimitFree   = config.chart_limit_free ?? 3
  const chartLimitPremium = config.chart_limit_premium ?? 50

  function toggleGatedFeature(featureKey) {
    const next = gatedFeatures.includes(featureKey)
      ? gatedFeatures.filter(k => k !== featureKey)
      : [...gatedFeatures, featureKey]
    save('gated_features', next)
  }

  function removeProduct(idx) {
    const next = products.filter((_, i) => i !== idx)
    save('products', next)
  }

  function addProduct() {
    if (!newProduct.key || !newProduct.stripePriceId) return
    const next = [...products, { ...newProduct, amountCents: parseInt(newProduct.amountCents, 10) || 0 }]
    save('products', next)
    setNewProduct({ key: '', name: '', stripePriceId: '', amountCents: '' })
  }

  return (
    <div className="admin-paywall-panel">
      {/* ── Global Toggle ─────────────────────────────── */}
      <div className="admin-paywall-section">
        <div className="admin-paywall-toggle-row">
          <span className="admin-paywall-label">Paywall Enabled</span>
          <button
            type="button"
            className={`admin-paywall-toggle ${paywallEnabled ? 'admin-paywall-toggle--on' : ''}`}
            onClick={() => save('paywall_enabled', !paywallEnabled)}
            disabled={saving === 'paywall_enabled'}
          >
            {paywallEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        {!paywallEnabled && (
          <p className="admin-paywall-hint">All features are currently free. Enable to enforce limits and gating.</p>
        )}
      </div>

      {/* ── Chart Limits ──────────────────────────────── */}
      <div className="admin-paywall-section">
        <h3 className="admin-paywall-heading">Chart Limits</h3>
        <div className="admin-paywall-limits">
          <label className="admin-paywall-limit-field">
            <span>Free tier</span>
            <input
              type="number" min="1" max="100"
              value={chartLimitFree}
              onChange={e => save('chart_limit_free', parseInt(e.target.value, 10) || 3)}
            />
          </label>
          <label className="admin-paywall-limit-field">
            <span>Premium tier</span>
            <input
              type="number" min="1" max="1000"
              value={chartLimitPremium}
              onChange={e => save('chart_limit_premium', parseInt(e.target.value, 10) || 50)}
            />
          </label>
        </div>
      </div>

      {/* ── Gated Features ────────────────────────────── */}
      <div className="admin-paywall-section">
        <h3 className="admin-paywall-heading">Gated Features</h3>
        <p className="admin-paywall-hint">Checked features require premium to access.</p>
        <div className="admin-paywall-features">
          {FEATURE_KEYS.map(({ key, label }) => (
            <label key={key} className="admin-paywall-feature-row">
              <input
                type="checkbox"
                checked={gatedFeatures.includes(key)}
                onChange={() => toggleGatedFeature(key)}
                disabled={saving === 'gated_features'}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Products (Stripe Price IDs) ───────────────── */}
      <div className="admin-paywall-section">
        <h3 className="admin-paywall-heading">Products</h3>
        {products.length > 0 && (
          <table className="admin-paywall-table">
            <thead>
              <tr><th>Key</th><th>Name</th><th>Price ID</th><th>Amount</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={i}>
                  <td>{p.key}</td>
                  <td>{p.name}</td>
                  <td className="admin-paywall-mono">{p.stripePriceId}</td>
                  <td>${((p.amountCents ?? 0) / 100).toFixed(2)}</td>
                  <td>
                    <button type="button" className="admin-paywall-remove" onClick={() => removeProduct(i)}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="admin-paywall-add-product">
          <input placeholder="key (e.g. premium_upgrade)" value={newProduct.key} onChange={e => setNewProduct(p => ({ ...p, key: e.target.value }))} />
          <input placeholder="Display name" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
          <input placeholder="Stripe Price ID" value={newProduct.stripePriceId} onChange={e => setNewProduct(p => ({ ...p, stripePriceId: e.target.value }))} />
          <input placeholder="Amount (cents)" type="number" value={newProduct.amountCents} onChange={e => setNewProduct(p => ({ ...p, amountCents: e.target.value }))} />
          <button type="button" onClick={addProduct} disabled={!newProduct.key || !newProduct.stripePriceId}>Add</button>
        </div>
      </div>

      {/* ── Purchase Log ──────────────────────────────── */}
      <div className="admin-paywall-section">
        <h3 className="admin-paywall-heading">Recent Purchases</h3>
        {purchases.length === 0 ? (
          <p className="admin-paywall-hint">No purchases yet.</p>
        ) : (
          <table className="admin-paywall-table">
            <thead>
              <tr><th>Date</th><th>Email</th><th>Product</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td>{p.email ?? '—'}</td>
                  <td>{p.product_key}</td>
                  <td>${((p.amount_cents ?? 0) / 100).toFixed(2)}</td>
                  <td className={`admin-paywall-status admin-paywall-status--${p.status}`}>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
