import { useState, useEffect } from 'react'
import { loadCharts, deleteChart, saveChart, renameChart } from '../utils/storage.js'
import { fetchCharts, fetchPublicCharts, isCloudEnabled, restoreChartsByEmail } from '../utils/cloudStorage.js'
import { getSavedEmail } from './EmailCapture.jsx'

export default function ChartsPanel({ savedChartId, onLoad, onNew, onDeleteCloud, onAddEmail, onGoToAbout, onRename, onDuplicate }) {
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
        <h2 className="charts-panel-title">🗂️ My Trees</h2>
        <button type="button" className="add-row-btn" onClick={onNew}>+ New Tree</button>
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
          ☁ Back up &amp; sync your trees
        </button>
      ) : null}

      {sorted.length > 0 ? (
        <div className="charts-list">
          {sorted.map(c => (
            <div key={c.id} className={`chart-item${c.id === savedChartId ? ' chart-item--active' : ''}`}>
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
                    <button type="button" className="chart-action-icon" title="Duplicate" onClick={() => onDuplicate?.(c)}>⎘</button>
                    <button type="button" className="connection-remove-btn" onClick={() => setPendingDeleteId(c.id)} aria-label="Delete">×</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="bulk-hint">No saved trees yet. Use 💾 Save on the tree screen.</p>
      )}

      {isCloudEnabled() && (
        <div className="restore-section">
          {!showRestore ? (
            <button type="button" className="restore-cloud-btn" onClick={() => { setShowRestore(true); setRestoreStatus('idle') }}>
              ☁ Restore from another device
            </button>
          ) : restoreStatus === 'success' ? (
            <div className="restore-result restore-result--ok">
              {restoreCount > 0
                ? `✓ ${restoreCount} tree${restoreCount !== 1 ? 's' : ''} restored!`
                : '✓ All up to date — no new trees to restore.'}
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
                autoFocus
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

      {onGoToAbout && (
        <button type="button" className="charts-data-link" onClick={onGoToAbout}>
          Your data &amp; privacy
        </button>
      )}

      {publicCharts.length > 0 && (
        <div className="featured-charts">
          <h3 className="featured-charts-title">✦ Featured Trees</h3>
          <p className="featured-charts-sub">Sample family trees to explore</p>
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
