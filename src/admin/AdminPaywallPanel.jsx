import { useState, useEffect } from 'react'
import { fetchPaywallConfig, updatePaywallConfig, fetchPurchases } from './utils/adminStorage.js'
import { FEATURE_KEYS } from '../utils/entitlements.js'

export default function AdminPaywallPanel() {
  const [config,    setConfig]    = useState(null)
  const [purchases, setPurchases] = useState([])
  const [saving,    setSaving]    = useState(null) // key being saved
  const [newProduct, setNewProduct] = useState({ key: '', name: '', stripePriceId: '', amountCents: '' })
  const [newCode,    setNewCode]    = useState({ code: '', tier: 'premium', max_uses: '', expires_at: '' })
  const [editIdx,    setEditIdx]    = useState(null)
  const [editDraft,  setEditDraft]  = useState(null)

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
  const promoCodes       = config.promo_codes ?? []
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

  function togglePromoCode(idx) {
    const next = promoCodes.map((p, i) => i === idx ? { ...p, active: !p.active } : p)
    save('promo_codes', next)
  }

  function removePromoCode(idx) {
    save('promo_codes', promoCodes.filter((_, i) => i !== idx))
  }

  function startEditCode(idx) {
    const p = promoCodes[idx]
    setEditIdx(idx)
    setEditDraft({
      code: p.code,
      tier: p.tier || 'premium',
      max_uses: p.max_uses ?? '',
      expires_at: p.expires_at ?? '',
    })
  }

  function saveEditCode() {
    if (editIdx === null || !editDraft) return
    const updated = { ...promoCodes[editIdx], ...editDraft }
    if (editDraft.max_uses === '' || editDraft.max_uses === undefined) {
      delete updated.max_uses
    } else {
      updated.max_uses = parseInt(editDraft.max_uses, 10)
    }
    if (!editDraft.expires_at) delete updated.expires_at
    const next = promoCodes.map((p, i) => i === editIdx ? updated : p)
    save('promo_codes', next)
    setEditIdx(null)
    setEditDraft(null)
  }

  function cancelEditCode() {
    setEditIdx(null)
    setEditDraft(null)
  }

  function addPromoCode() {
    if (!newCode.code.trim()) return
    const entry = { code: newCode.code.trim(), tier: newCode.tier, active: true, uses: 0 }
    if (newCode.max_uses) entry.max_uses = parseInt(newCode.max_uses, 10)
    if (newCode.expires_at) entry.expires_at = newCode.expires_at
    save('promo_codes', [...promoCodes, entry])
    setNewCode({ code: '', tier: 'premium', max_uses: '', expires_at: '' })
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
            <span>Celestial tier</span>
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
        <p className="admin-paywall-hint">Checked features require Celestial to access.</p>
        <div className="admin-paywall-features">
          {(() => {
            const groups = []
            let lastGroup = null
            for (const { key, label, group } of FEATURE_KEYS) {
              if (group !== lastGroup) {
                groups.push(<p key={`g-${group}`} style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: groups.length > 0 ? '0.6rem 0 0.2rem' : '0 0 0.2rem', padding: 0 }}>{group}</p>)
                lastGroup = group
              }
              groups.push(
                <label key={key} className="admin-paywall-feature-row">
                  <input
                    type="checkbox"
                    checked={gatedFeatures.includes(key)}
                    onChange={() => toggleGatedFeature(key)}
                    disabled={saving === 'gated_features'}
                  />
                  <span>{label}</span>
                </label>
              )
            }
            return groups
          })()}
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

      {/* ── Gift Codes ─────────────────────────────── */}
      <div className="admin-paywall-section">
        <h3 className="admin-paywall-heading">Gift Codes</h3>
        <p className="admin-paywall-hint">Users enter these in the upgrade prompt to unlock Celestial. Separate from Stripe discount codes.</p>
        {promoCodes.length > 0 && (
          <table className="admin-paywall-table">
            <thead>
              <tr><th>Code</th><th>Tier</th><th>Uses</th><th>Expires</th><th>Active</th><th></th></tr>
            </thead>
            <tbody>
              {promoCodes.map((p, i) => (
                editIdx === i ? (
                  <tr key={i} style={{ background: 'rgba(201,168,76,0.06)' }}>
                    <td><input value={editDraft.code} onChange={e => setEditDraft(d => ({ ...d, code: e.target.value }))} style={{ width: '80px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} /></td>
                    <td>
                      <select value={editDraft.tier} onChange={e => setEditDraft(d => ({ ...d, tier: e.target.value }))} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.2rem', fontSize: '0.7rem' }}>
                        <option value="premium">Celestial</option>
                      </select>
                    </td>
                    <td><input type="number" min="0" value={editDraft.max_uses} onChange={e => setEditDraft(d => ({ ...d, max_uses: e.target.value }))} placeholder="—" style={{ width: '50px', background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} /></td>
                    <td><input type="date" value={editDraft.expires_at} onChange={e => setEditDraft(d => ({ ...d, expires_at: e.target.value }))} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.2rem', fontSize: '0.65rem' }} /></td>
                    <td colSpan="2" style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={saveEditCode} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', color: 'var(--gold)', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Save</button>
                      <button type="button" onClick={cancelEditCode} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', color: 'var(--text-dim)', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={i} style={{ opacity: p.active === false ? 0.4 : 1 }}>
                    <td className="admin-paywall-mono">{p.code}</td>
                    <td>{p.tier}</td>
                    <td>{p.uses ?? 0}{p.max_uses ? `/${p.max_uses}` : ''}</td>
                    <td style={{ fontSize: '0.65rem' }}>{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-paywall-toggle ${p.active !== false ? 'admin-paywall-toggle--on' : ''}`}
                        onClick={() => togglePromoCode(i)}
                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}
                      >
                        {p.active !== false ? 'ON' : 'OFF'}
                      </button>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={() => startEditCode(i)} style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', color: 'var(--text-dim)', background: 'none', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', marginRight: '4px' }}>Edit</button>
                      <button type="button" className="admin-paywall-remove" onClick={() => removePromoCode(i)}>x</button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
        <div className="admin-paywall-add-product">
          <input placeholder="Code (case-sensitive)" value={newCode.code} onChange={e => setNewCode(p => ({ ...p, code: e.target.value }))} />
          <select value={newCode.tier} onChange={e => setNewCode(p => ({ ...p, tier: e.target.value }))} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.3rem' }}>
            <option value="premium">Celestial</option>
          </select>
          <input type="number" placeholder="Max uses (empty = unlimited)" min="1" value={newCode.max_uses} onChange={e => setNewCode(p => ({ ...p, max_uses: e.target.value }))} style={{ width: '120px' }} />
          <input type="date" value={newCode.expires_at} onChange={e => setNewCode(p => ({ ...p, expires_at: e.target.value }))} title="Expiration date (optional)" style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.3rem' }} />
          <button type="button" onClick={addPromoCode} disabled={!newCode.code.trim()}>Add</button>
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
              <tr><th>Date (EST)</th><th>Email</th><th>Product</th><th>Amount</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {purchases.map(p => {
                const isTest = p.stripe_session_id?.startsWith('cs_test_')
                const isPromo = p.stripe_session_id?.startsWith('promo_')
                const estDate = new Date(p.created_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                return (
                <tr key={p.id} style={isTest ? { opacity: 0.6 } : undefined}>
                  <td style={{ fontSize: '0.65rem', whiteSpace: 'nowrap' }}>{estDate}</td>
                  <td>{p.email ?? '—'}</td>
                  <td>{p.product_key}</td>
                  <td>${((p.amount_cents ?? 0) / 100).toFixed(2)}</td>
                  <td className={`admin-paywall-status admin-paywall-status--${p.status}`}>{p.status}</td>
                  <td style={{ fontSize: '0.6rem' }}>
                    {isTest && <span style={{ background: 'rgba(255,165,0,0.15)', color: '#ffa500', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '3px', padding: '0.1rem 0.35rem' }}>TEST</span>}
                    {isPromo && <span style={{ background: 'rgba(184,160,212,0.15)', color: '#b8a0d4', border: '1px solid rgba(184,160,212,0.3)', borderRadius: '3px', padding: '0.1rem 0.35rem' }}>PROMO</span>}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
