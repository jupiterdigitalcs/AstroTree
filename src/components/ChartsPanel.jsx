import { useState, useEffect } from 'react'
import { loadCharts, deleteChart, saveChart, renameChart, CHARTS_CHANGED_EVENT } from '../utils/storage.js'
import { fetchPublicCharts, isCloudEnabled } from '../utils/cloudStorage.js'
import { getSavedEmail } from './EmailCapture.jsx'
import { buildDemoChart, buildDemoCrewChart } from '../utils/demoData.js'

// Static sample chart metadata — avoids async in render path
const SAMPLE_CHARTS = [
  { id: '__sample_andersons__', title: 'The Andersons', memberCount: 9, desc: '3 generations', loader: buildDemoChart },
  { id: '__sample_crew__', title: 'The Crew', memberCount: 8, desc: 'friends & coworkers', loader: buildDemoCrewChart },
]
import { isPaywallEnabled, getChartLimit } from '../utils/entitlements.js'

export default function ChartsPanel({ savedChartId, onLoad, onNew, onDeleteCloud, onAddEmail, onGoToAbout, onRename, onDuplicate, entitlements, onUpgrade, authUser, authLoading, onSignIn, onSignOut, refreshTick }) {
  const [charts,          setCharts]          = useState(() => loadCharts())
  const [publicCharts,    setPublicCharts]    = useState([])
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [renamingId,      setRenamingId]      = useState(null)
  const [renameValue,     setRenameValue]     = useState('')
  const savedEmail = getSavedEmail()

  useEffect(() => {
    if (!isCloudEnabled()) return
    fetchPublicCharts().then(rows => { if (rows.length) setPublicCharts(rows) })
  }, [])

  // Reload charts when cloud sync merges new data (e.g. after sign-in)
  useEffect(() => {
    if (refreshTick > 0) reloadLocal()
  }, [refreshTick]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when any code path writes to localStorage via storage.js helpers.
  // Needed because in cosmic mode this panel is pre-mounted in a BottomSheet,
  // so loadCharts() at mount time misses charts saved later by handleAdd's
  // auto-save or the periodic auto-save in useChartManager.
  useEffect(() => {
    const handler = () => reloadLocal()
    window.addEventListener(CHARTS_CHANGED_EVENT, handler)
    return () => window.removeEventListener(CHARTS_CHANGED_EVENT, handler)
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
            <button type="button" className="chart-limit-upgrade" onClick={onUpgrade}>✦ Unlock Celestial</button>
          ) : (
            <button type="button" className="add-row-btn" onClick={onNew}>+ New Chart</button>
          )
        })()}
        {(!entitlements || !isPaywallEnabled(entitlements?.config)) && (
          <button type="button" className="add-row-btn" onClick={onNew}>+ New Chart</button>
        )}
      </div>

      {/* ── Account status + Celestial explainer ─────────────────────────── */}
      {authUser ? (
        entitlements?.tier === 'premium' ? (
          <div className="celestial-explainer celestial-explainer--active" id="celestial-info">
            <h3 className="celestial-explainer-title">✦ Celestial</h3>
            <p className="celestial-explainer-text">
              All views, full insights, unlimited charts — unlocked forever.
              Signed in as <strong>{authUser.email}</strong>.
            </p>
          </div>
        ) : (
          <div className="celestial-explainer" id="celestial-info">
            <h3 className="celestial-explainer-title">✓ Signed in</h3>
            <p className="celestial-explainer-text">
              Signed in as <strong>{authUser.email}</strong>. Your charts will follow you to any device.
            </p>
            <button type="button" className="celestial-explainer-btn" onClick={onUpgrade}>
              ✦ Unlock Celestial — $9.99
            </button>
          </div>
        )
      ) : !authLoading && (
        // Not signed in — Celestial is account-bound, so the only state here
        // is "explain Celestial + sign in to unlock". The previous "isn't
        // protected" branch is dead now that tier is always 'free' when no
        // auth user.
        <div className="celestial-explainer" id="celestial-info">
          <h3 className="celestial-explainer-title">✦ What is Celestial?</h3>
          <p className="celestial-explainer-text">
            <strong>Celestial</strong> is a one-time $9.99 upgrade that unlocks the full cosmos:
          </p>
          <ul className="celestial-explainer-list">
            <li>☉ Zodiac Wheel + Constellation views</li>
            <li>☽ Tables — sortable sun, moon &amp; planet grid</li>
            <li>✦ Full Insights — compatibility, roles, zodiac threads</li>
            <li>✦ The Full DIG — every slide in your cosmic story</li>
            <li>📚 Unlimited charts — save as many as you want</li>
          </ul>
          {onSignIn && (
            <button type="button" className="celestial-explainer-btn" onClick={onSignIn}>
              ✦ Sign in to Unlock Celestial
            </button>
          )}
        </div>
      )}

      {/* ── Account status ────────────────────────────────────────────── */}
      {authUser ? (
        <div className="charts-account-row">
          <span className="charts-account-check">✓</span>
          <span className="charts-account-email">{authUser.email}</span>
          <button type="button" className="charts-signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
      ) : null}

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
        {charts.length > 0 && (
          <p className="chart-ideas-hint">
            Use <strong>⎘</strong> on any chart above to duplicate it, then rename and edit from there.
          </p>
        )}
        {charts.length <= 1 && (
          <>
            <p className="chart-ideas-title">✦ Ideas for more charts</p>
            <ul className="chart-ideas-list">
              <li><span className="chart-ideas-icon">🌳</span><span><strong>Go back as far as you can</strong> — add grandparents, great-grandparents, ancestors</span></li>
              <li><span className="chart-ideas-icon">👥</span><span><strong>Friend group</strong> — your closest circle, no family required</span></li>
              <li><span className="chart-ideas-icon">🏢</span><span><strong>Work team</strong> — colleagues, co-founders, or collaborators</span></li>
            </ul>
          </>
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
