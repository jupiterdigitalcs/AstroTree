import { useState, useEffect } from 'react'
import { loadCharts, deleteChart, saveChart, renameChart } from '../utils/storage.js'
import { fetchCharts, fetchPublicCharts, isCloudEnabled, restoreChartsByEmail } from '../utils/cloudStorage.js'
import { getSavedEmail } from './EmailCapture.jsx'
import { buildDemoChart, buildDemoCrewChart } from '../utils/demoData.js'

// Static sample chart metadata — avoids async in render path
const SAMPLE_CHARTS = [
  { id: '__sample_andersons__', title: 'The Andersons', memberCount: 9, desc: '3 generations', loader: buildDemoChart },
  { id: '__sample_crew__', title: 'The Crew', memberCount: 8, desc: 'friends & coworkers', loader: buildDemoCrewChart },
]
import { isPaywallEnabled, getChartLimit } from '../utils/entitlements.js'

export default function ChartsPanel({ savedChartId, onLoad, onNew, onDeleteCloud, onAddEmail, onGoToAbout, onRename, onDuplicate, entitlements, onUpgrade }) {
  const [charts,          setCharts]          = useState(() => loadCharts())
  const [publicCharts,    setPublicCharts]    = useState([])
  const [restoring,       setRestoring]       = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [showRestore,     setShowRestore]     = useState(false)
  const [restoreEmail,    setRestoreEmail]    = useState('')
  const [restoreStatus,   setRestoreStatus]   = useState('idle')
  const [restoreCount,    setRestoreCount]    = useState(0)
  const [renamingId,      setRenamingId]      = useState(null)
  const [renameValue,     setRenameValue]     = useState('')
  const savedEmail = getSavedEmail()

  useEffect(() => {
    if (!isCloudEnabled()) return
    fetchPublicCharts().then(rows => { if (rows.length) setPublicCharts(rows) })
  }, [])

  function reloadLocal() { setCharts(loadCharts()) }

  function handleDelete(id) {
    deleteChart(id)
    onDeleteCloud?.(id)
    setPendingDeleteId(null)
    reloadLocal()
  }

  function startRename(chart) {
    setRenamingId(chart.id)
    setRenameValue(chart.title)
    setPendingDeleteId(null)
  }

  function commitRename(id) {
    if (!renameValue.trim()) { setRenamingId(null); return }
    const updated = renameChart(id, renameValue.trim())
    if (updated) onRename?.(updated)
    reloadLocal()
    setRenamingId(null)
  }

  async function handleEmailRestore(e) {
    e.preventDefault()
    if (!restoreEmail.trim() || restoring) return
    setRestoreStatus('loading')
    const { restoreChartsByEmail } = await import('../utils/cloudStorage.js')
    const result = await restoreChartsByEmail(restoreEmail)
    if (!result.ok) {
      setRestoreStatus(result.error?.includes('No account') ? 'not_found' : 'error')
      return
    }
    const cloudCharts = await fetchCharts()
    const local = loadCharts()
    const localIds = new Set(local.map(c => c.id))
    for (const cc of cloudCharts) {
      if (!localIds.has(cc.id)) saveChart(cc)
    }
    reloadLocal()
    setRestoreCount(result.count ?? 0)
    setRestoreStatus('success')
    try { localStorage.setItem('astrotree_user_email', restoreEmail.trim()) } catch {}
  }

  const sorted = [...charts].sort((a, b) => {
    if (a.id === savedChartId) return -1
    if (b.id === savedChartId) return 1
    return new Date(b.savedAt) - new Date(a.savedAt)
  })

  return (
    <div className="charts-panel">
      <div className="charts-panel-header">
        <h2 className="charts-panel-title">🗂️ My Charts
          {entitlements && isPaywallEnabled(entitlements.config) && (() => {
            const limit = getChartLimit(entitlements.tier, entitlements.config)
            const count = charts.filter(c => !c.isSample).length
            return limit < Infinity ? (
              <span className={`chart-limit-badge${count >= limit ? ' chart-limit-badge--warn' : ''}`}>
                {' '}({count}/{limit})
              </span>
            ) : null
          })()}
        </h2>
        {entitlements && isPaywallEnabled(entitlements.config) && (() => {
          const limit = getChartLimit(entitlements.tier, entitlements.config)
          const count = charts.filter(c => !c.isSample).length
          return count >= limit && entitlements.tier !== 'premium' ? (
            <button type="button" className="chart-limit-upgrade" onClick={onUpgrade}>Upgrade</button>
          ) : (
            <button type="button" className="add-row-btn" onClick={onNew}>+ New Chart</button>
          )
        })()}
        {(!entitlements || !isPaywallEnabled(entitlements?.config)) && (
          <button type="button" className="add-row-btn" onClick={onNew}>+ New Chart</button>
        )}
      </div>

      {/* Email indicator / opt-in */}
      {savedEmail ? (
        <div className="charts-email-indicator">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{flexShrink:0}}>
            <path d="M1 3h10v7H1z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 3l5 4 5-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {savedEmail}
        </div>
      ) : onAddEmail ? (
        <button type="button" className="charts-add-email-btn" onClick={onAddEmail}>
          ☁ Back up &amp; sync your charts
        </button>
      ) : null}

      {isCloudEnabled() && (
        <div className="restore-section restore-section--top">
          {!showRestore ? (
            <button type="button" className="restore-cloud-btn" onClick={() => { setShowRestore(true); setRestoreStatus('idle') }}>
              ☁ Restore from another device
            </button>
          ) : restoreStatus === 'success' ? (
            <div className="restore-result restore-result--ok">
              {restoreCount > 0
                ? `✓ ${restoreCount} chart${restoreCount !== 1 ? 's' : ''} restored!`
                : '✓ All up to date — no new charts to restore.'}
              <button type="button" className="restore-dismiss" onClick={() => { setShowRestore(false); setRestoreStatus('idle') }}>×</button>
            </div>
          ) : (
            <form className="restore-form" onSubmit={handleEmailRestore}>
              <p className="restore-form-label">Enter the email you used on your other device:</p>
              <input
                type="email"
                className="save-dialog-input"
                placeholder="your@email.com"
                value={restoreEmail}
                onChange={e => { setRestoreEmail(e.target.value); setRestoreStatus('idle') }}
                disabled={restoreStatus === 'loading'}
              />
              {restoreStatus === 'not_found' && <p className="restore-error">No account found with that email.</p>}
              {restoreStatus === 'error'     && <p className="restore-error">Something went wrong — try again.</p>}
              <div className="restore-form-btns">
                <button type="button" className="save-dialog-cancel" onClick={() => { setShowRestore(false); setRestoreStatus('idle') }}>Cancel</button>
                <button type="submit" className="save-dialog-save" disabled={restoreStatus === 'loading' || !restoreEmail.trim()}>
                  {restoreStatus === 'loading' ? 'Restoring…' : 'Restore'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {sorted.length > 0 ? (() => {
        const chartLimit = entitlements && isPaywallEnabled(entitlements.config) && entitlements.tier !== 'premium'
          ? getChartLimit(entitlements.tier, entitlements.config)
          : Infinity
        return (
        <div className="charts-list">
          {sorted.map((c, idx) => {
            const isLocked = idx >= chartLimit && c.id !== savedChartId
            return (
            <div key={c.id} className={`chart-item${c.id === savedChartId ? ' chart-item--active' : ''}${isLocked ? ' chart-item--locked' : ''}`} onClick={isLocked ? onUpgrade : undefined}>
              {pendingDeleteId === c.id ? (
                <div className="chart-item-confirm">
                  <span className="chart-item-confirm-text">Delete "{c.title}"?</span>
                  <div className="chart-item-confirm-btns">
                    <button type="button" className="connection-remove-btn" onClick={() => handleDelete(c.id)}>Delete</button>
                    <button type="button" className="connection-add-btn" onClick={() => setPendingDeleteId(null)}>Cancel</button>
                  </div>
                </div>
              ) : renamingId === c.id ? (
                <form
                  className="chart-item-rename"
                  onSubmit={e => { e.preventDefault(); commitRename(c.id) }}
                >
                  <input
                    className="chart-rename-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    autoFocus
                    onBlur={() => commitRename(c.id)}
                    onKeyDown={e => e.key === 'Escape' && setRenamingId(null)}
                  />
                  <button type="submit" className="connection-add-btn">Save</button>
                  <button type="button" className="connection-remove-btn" onClick={() => setRenamingId(null)}>✕</button>
                </form>
              ) : (
                <>
                  <div className="chart-item-info">
                    <span className="chart-item-title">
                      {c.title}
                      {c.id === savedChartId && <span className="chart-item-badge">active</span>}
                    </span>
                    <span className="chart-item-meta">
                      {c.nodes.length} member{c.nodes.length !== 1 ? 's' : ''} · {new Date(c.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="chart-item-actions">
                    {c.id !== savedChartId && (
                      <button type="button" className="connection-add-btn" onClick={() => onLoad(c)}>Load</button>
                    )}
                    <button type="button" className="chart-action-icon" title="Rename" onClick={() => startRename(c)}>✎</button>
                    {onDuplicate && <button type="button" className="chart-action-icon" title="Duplicate" onClick={() => onDuplicate(c)}>⎘</button>}
                    <button type="button" className="connection-remove-btn" onClick={() => setPendingDeleteId(c.id)} aria-label="Delete">×</button>
                  </div>
                </>
              )}
            </div>
            )
          })}
        </div>
        )
      })() : (
        <p className="bulk-hint">No saved charts yet — your first chart saves automatically.</p>
      )}

      {/* ── Chart ideas ───────────────────────────────────────────────── */}
      <div className="chart-ideas">
        <p className="chart-ideas-title">✦ Ideas for more charts</p>
        <p className="chart-ideas-sub">
          Each chart is its own view — duplicate an existing one and reshape it to explore a different lens.
        </p>
        <ul className="chart-ideas-list">
          <li><span className="chart-ideas-icon">🌳</span><span><strong>Go back as far as you can</strong> — add grandparents, great-grandparents, ancestors — the deeper you go, the richer the generational patterns</span></li>
          <li><span className="chart-ideas-icon">🌱</span><span><strong>One generation</strong> — just siblings &amp; cousins, or just the parents &amp; grandparents</span></li>
          <li><span className="chart-ideas-icon">⎘</span><span><strong>Family without partners</strong> — duplicate a chart and remove partners to see a different lens on the same group</span></li>
          <li><span className="chart-ideas-icon">👥</span><span><strong>Friend group</strong> — your closest circle, no family required</span></li>
          <li><span className="chart-ideas-icon">🏢</span><span><strong>Work team</strong> — colleagues, co-founders, or collaborators</span></li>
        </ul>
        {charts.length > 0 && (
          <p className="chart-ideas-hint">
            Use <strong>⎘</strong> on any chart above to duplicate it, then rename and edit from there.
          </p>
        )}
        <button type="button" className="add-row-btn chart-ideas-new-btn" onClick={onNew}>
          ＋ New Chart
        </button>
      </div>

      {/* ── Sample Trees ──────────────────────────────────────────────── */}
      <div className="sample-charts">
        <h3 className="sample-charts-title">✦ Sample Charts</h3>
        <p className="sample-charts-sub">Explore demo charts to see how AstroDig works</p>
        <div className="charts-list">
          {SAMPLE_CHARTS.map(s => (
            <div key={s.id} className="chart-item chart-item--sample">
              <div className="chart-item-info">
                <span className="chart-item-title">
                  {s.title}
                  <span className="chart-item-badge chart-item-badge--sample">sample</span>
                </span>
                <span className="chart-item-meta">
                  {s.memberCount} members · {s.desc}
                </span>
              </div>
              <div className="chart-item-actions">
                <button type="button" className="connection-add-btn" onClick={async () => onLoad(await s.loader())}>View</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {onGoToAbout && (
        <button type="button" className="charts-data-link" onClick={onGoToAbout}>
          Your data &amp; privacy
        </button>
      )}

      {publicCharts.length > 0 && (
        <div className="featured-charts">
          <h3 className="featured-charts-title">✦ Featured Charts</h3>
          <p className="featured-charts-sub">Sample charts to explore</p>
          <div className="charts-list">
            {publicCharts.map(c => (
              <div key={c.id} className="chart-item chart-item--featured">
                <div className="chart-item-info">
                  <span className="chart-item-title">
                    {c.title}
                    <span className="chart-item-badge chart-item-badge--sample">
                      {c.isSample ? 'sample' : 'public'}
                    </span>
                  </span>
                  <span className="chart-item-meta">
                    {c.nodes.length} member{c.nodes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="chart-item-actions">
                  <button type="button" className="connection-add-btn" onClick={() => onLoad(c)}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
