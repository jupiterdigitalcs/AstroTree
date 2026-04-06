import { useState, useMemo, useRef } from 'react'
import { DateInput } from './DateInput.jsx'
import { PlanetSign } from './PlanetSign.jsx'
import { checkIngressWarnings } from '../utils/astrology.js'

export default function EditMemberPanel({
  node,
  allNodes,
  edges,
  onUpdate,
  onDelete,
  onAddEdge,
  onRemoveEdge,
  onCancel,
  onGoToInsights,
}) {
  const [name,           setName]           = useState(node.data.name)
  const [birthdate,      setBirthdate]      = useState(node.data.birthdate)
  const [birthTime,      setBirthTime]      = useState(node.data.birthTime ?? '')
  const [exactBirthTime, setExactBirthTime] = useState(node.data.exactBirthTime ?? false)
  const [error,          setError]          = useState('')

  // Warnings based on birthdate only (no birth time)
  const originalWarnings = useMemo(
    () => birthdate ? checkIngressWarnings(birthdate) : [],
    [birthdate]
  )
  // Active warnings — clears when a confirming time is entered
  const ingressWarnings = useMemo(
    () => checkIngressWarnings(birthdate, birthTime || null),
    [birthdate, birthTime]
  )

  // Show exact-time checkbox when birth time is a round hour near a sign change
  const showExactCheckbox = useMemo(() => {
    if (!birthTime || !originalWarnings.length) return false
    const [h, m] = birthTime.split(':').map(Number)
    if (m !== 0) return false
    return originalWarnings.some(w => Math.abs(h - w.ingressHour) <= 1)
  }, [birthTime, originalWarnings])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [connectTo,     setConnectTo]     = useState(null) // id of node being connected
  const [connSearch,    setConnSearch]    = useState('')
  const [savedFlash,    setSavedFlash]    = useState(false)
  const savedTimerRef = useRef(null)

  function showSaved() {
    clearTimeout(savedTimerRef.current)
    setSavedFlash(true)
    savedTimerRef.current = setTimeout(() => setSavedFlash(false), 2000)
  }

  function doSave(overrides = {}) {
    const n  = (overrides.name      !== undefined ? overrides.name      : name).trim()
    const bd = overrides.birthdate  !== undefined ? overrides.birthdate  : birthdate
    if (!n || !bd) return
    const bt  = overrides.birthTime      !== undefined ? overrides.birthTime      : (birthTime || null)
    const ebt = overrides.exactBirthTime !== undefined ? overrides.exactBirthTime : exactBirthTime
    onUpdate(node.id, { name: n, birthdate: bd, birthTime: bt, exactBirthTime: ebt }, { keepOpen: true })
    showSaved()
  }

  // ── Derive connections fresh from props every render ──────────────────────
  const parentEdges = edges.filter(e => e.target === node.id && e.data?.relationType === 'parent-child')
  const childEdges  = edges.filter(e => e.source === node.id && e.data?.relationType === 'parent-child')
  const spouseEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'spouse'
  )
  const friendEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'friend'
  )
  const coworkerEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'coworker'
  )

  // Already connected node IDs
  const connectedIds = new Set([node.id])
  edges.forEach(e => {
    if (e.source === node.id) connectedIds.add(e.target)
    if (e.target === node.id) connectedIds.add(e.source)
  })
  const eligibleNodes = allNodes
    .filter(n => !connectedIds.has(n.id))
    .sort((a, b) => (a.data.birthdate || '9999').localeCompare(b.data.birthdate || '9999'))

  // ── Ancestor / descendant sets (for preventing impossible relationships) ──
  const ancestors = new Set()
  const descendants = new Set()
  function walkUp(id) {
    edges.forEach(e => {
      if (e.target === id && e.data?.relationType === 'parent-child' && !ancestors.has(e.source)) {
        ancestors.add(e.source)
        walkUp(e.source)
      }
    })
  }
  function walkDown(id) {
    edges.forEach(e => {
      if (e.source === id && e.data?.relationType === 'parent-child' && !descendants.has(e.target)) {
        descendants.add(e.target)
        walkDown(e.target)
      }
    })
  }
  walkUp(node.id)
  walkDown(node.id)

  // How many parents does a given node have?
  function parentCountOf(nodeId) {
    return edges.filter(e => e.target === nodeId && e.data?.relationType === 'parent-child').length
  }

  // ── Compute valid relationship types for a specific other node ────────────
  function getValidRelationships(otherId) {
    const types = []

    // Parent of me: only if I have < 2 parents, and other is not my descendant
    if (parentEdges.length < 2 && !descendants.has(otherId)) {
      types.push({ key: 'parent', label: 'Parent of me', action: () => addConn(otherId, node.id) })
    }

    // My child: only if other has < 2 parents, and other is not my ancestor
    if (parentCountOf(otherId) < 2 && !ancestors.has(otherId)) {
      types.push({ key: 'child', label: 'My child', action: () => addConn(node.id, otherId) })
    }

    // Spouse: always valid (non-hierarchical)
    types.push({ key: 'spouse', label: 'Spouse / partner', action: () => addConn(node.id, otherId, 'spouse') })

    // Friend: always valid
    types.push({ key: 'friend', label: 'Friend', action: () => addConn(node.id, otherId, 'friend') })

    // Coworker: always valid
    types.push({ key: 'coworker', label: 'Coworker', action: () => addConn(node.id, otherId, 'coworker') })

    return types
  }

  // ── Partner-children suggestion ───────────────────────────────────────────
  const myChildIds = new Set(childEdges.map(e => e.target))
  const partnerChildSuggestions = spouseEdges.flatMap(spouseEdge => {
    const partnerId  = spouseEdge.source === node.id ? spouseEdge.target : spouseEdge.source
    const partner    = allNodes.find(n => n.id === partnerId)
    if (!partner) return []
    return edges
      .filter(e => e.source === partnerId && e.data?.relationType === 'parent-child' && !myChildIds.has(e.target) && e.target !== node.id)
      .map(e => ({ partner, childId: e.target, childNode: allNodes.find(n => n.id === e.target) }))
      .filter(s => s.childNode)
  })

  function addConn(src, tgt, type) {
    onAddEdge(src, tgt, type)
    showSaved()
  }

  function removeConn(edgeId) {
    onRemoveEdge(edgeId)
    showSaved()
  }

  function handleConnect(otherId) {
    const types = getValidRelationships(otherId)
    if (types.length === 1) {
      // Only one option — just do it
      types[0].action()
      setConnectTo(null)
    } else {
      setConnectTo(otherId)
    }
  }

  const connectTarget = connectTo ? allNodes.find(n => n.id === connectTo) : null
  const connectOptions = connectTo ? getValidRelationships(connectTo) : []

  // If selected node got connected (no longer eligible), reset
  if (connectTo && connectedIds.has(connectTo)) {
    // will reset on next render via the effect below
    setTimeout(() => setConnectTo(null), 0)
  }

  const hasConnections = parentEdges.length > 0 || childEdges.length > 0 ||
                         spouseEdges.length > 0 || friendEdges.length > 0 ||
                         coworkerEdges.length > 0 || eligibleNodes.length > 0

  return (
    <div className="add-form edit-panel">
      <div className="edit-panel-title-row">
        <h2 className="form-title">✦ Edit Member</h2>
        {savedFlash && <span className="edit-saved-flash">✓ Saved</span>}
      </div>

      <div className="name-date-row">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => doSave()}
          />
        </label>

        <label>
          Birthdate
          <DateInput value={birthdate} onChange={v => { setBirthdate(v); if (v && name.trim()) doSave({ birthdate: v }) }} />
        </label>
      </div>

      {/* ── Birth time ────────────────────────────────────────────────────── */}
      <label>
        Birth time <span className="birthtime-optional">(optional)</span>
        <input
          type="time"
          className="row-input birthtime-input"
          value={birthTime}
          onChange={e => { setBirthTime(e.target.value); setExactBirthTime(false) }}
          onBlur={e => doSave({ birthTime: e.target.value })}
        />
      </label>

      {/* Ingress context — only shown when astrologically relevant */}
      {originalWarnings.length > 0 && (
        <div className={`ingress-context${birthTime && !ingressWarnings.length ? ' ingress-context--resolved' : ''}`}>
          {birthTime && !ingressWarnings.length ? (
            <span className="ingress-context-ok">✓ Sign confirmed for this birth time</span>
          ) : (
            <>
              <span className="ingress-context-note">
                {originalWarnings.length === 1
                  ? `${originalWarnings[0].name} changes sign on this date — birth time helps confirm which sign`
                  : `${originalWarnings.length} planets change sign on this date — birth time helps confirm the signs`}
              </span>
              {originalWarnings.map(w => (
                <span key={w.name} className="ingress-warning-planet">
                  <PlanetSign planet={w.planet} sign={w.signStart} />
                  <span className="ingress-warning-arrow">→</span>
                  <PlanetSign planet={w.planet} sign={w.signEnd} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                    (changes at {w.ingressTime})
                  </span>
                </span>
              ))}
            </>
          )}
          {showExactCheckbox && (
            <label className="birthtime-exact-label">
              <input
                type="checkbox"
                checked={exactBirthTime}
                onChange={e => { setExactBirthTime(e.target.checked); doSave({ exactBirthTime: e.target.checked }) }}
                style={{ accentColor: 'var(--gold)' }}
              />
              This time is exact
              <span className="ingress-warning-note" style={{ fontStyle: 'normal' }}>
                (Round number near a sign change — confirm from records if unsure)
              </span>
            </label>
          )}
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      {/* ── Connections ─────────────────────────────────────────────────── */}
      {hasConnections && (
        <div className="connections-section">
          <span className="parent-select-label">Connections</span>

          {parentEdges.length > 0 && (
            <ConnGroup label="Parents" edgeList={parentEdges}
              getOther={e => e.source} allNodes={allNodes} onRemove={removeConn} />
          )}
          {childEdges.length > 0 && (
            <ConnGroup label="Children" edgeList={childEdges}
              getOther={e => e.target} allNodes={allNodes} onRemove={removeConn} />
          )}
          {spouseEdges.length > 0 && (
            <ConnGroup label="Spouse / Partner" edgeList={spouseEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#e879a8" />
          )}
          {friendEdges.length > 0 && (
            <ConnGroup label="Friends" edgeList={friendEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#5bc8f5" />
          )}
          {coworkerEdges.length > 0 && (
            <ConnGroup label="Coworkers" edgeList={coworkerEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={removeConn} accentColor="#a0a0b8" />
          )}

          {/* Partner-children quick-connect */}
          {partnerChildSuggestions.length > 0 && (
            <button
              type="button"
              className="suggestion-btn"
              onClick={() => { partnerChildSuggestions.forEach(s => addConn(node.id, s.childId)) }}
            >
              + Also parent of {partnerChildSuggestions[0].partner.data.name}'s{' '}
              {partnerChildSuggestions.length === 1
                ? partnerChildSuggestions[0].childNode.data.name
                : `${partnerChildSuggestions.length} children`}
            </button>
          )}

          {/* ── Add connections: person chips → inline relationship pills ── */}
          {eligibleNodes.length > 0 && (
            <div className="conn-add-section">
              <div className="conn-add-header">
                <span className="parent-select-label">Add connection</span>
                <span className="conn-age-hint">oldest → youngest</span>
              </div>
              {eligibleNodes.length > 5 && (
                <input
                  className="conn-search-input"
                  type="search"
                  placeholder="Filter people…"
                  value={connSearch}
                  onChange={e => setConnSearch(e.target.value)}
                />
              )}
              <div className="conn-eligible-grid">
                {eligibleNodes
                  .filter(n => !connSearch || n.data.name.toLowerCase().includes(connSearch.toLowerCase()))
                  .map(n => (
                    <button
                      key={n.id}
                      type="button"
                      className={`conn-eligible-chip${connectTo === n.id ? ' selected' : ''}`}
                      onClick={() => handleConnect(n.id)}
                    >
                      <span className="conn-chip-symbol">{n.data.symbol}</span>
                      <span>{n.data.name}</span>
                    </button>
                  ))}
              </div>
              {connectTarget && (
                <div className="conn-type-row">
                  <span className="conn-type-label">
                    {connectTarget.data.symbol} {connectTarget.data.name} is my:
                  </span>
                  <div className="conn-type-pills">
                    {connectOptions.map(opt => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`conn-type-pill conn-type-pill--${opt.key}`}
                        onClick={() => { opt.action(); setConnectTo(null) }}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button type="button" className="conn-type-cancel-pill" onClick={() => setConnectTo(null)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {onGoToInsights && allNodes.length >= 2 && edges.length > 0 && (
        <button type="button" className="edit-insights-cta" onClick={onGoToInsights}>
          <span>✦</span>
          <span>See Family Insights</span>
          <span>→</span>
        </button>
      )}

      {!confirmDelete ? (
        <button type="button" className="delete-btn" onClick={() => setConfirmDelete(true)}>
          Remove from Tree
        </button>
      ) : (
        <div className="delete-confirm">
          <p>Remove {node.data.name}?</p>
          <div className="delete-confirm-actions">
            <button type="button" className="delete-btn" onClick={() => onDelete(node.id)}>Yes, Remove</button>
            <button type="button" className="cancel-btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Local helpers ─────────────────────────────────────────────────────────────

function ConnGroup({ label, edgeList, getOther, allNodes, onRemove, accentColor }) {
  return (
    <div className="connection-group">
      <span className="connection-group-label" style={accentColor ? { color: accentColor + 'cc' } : undefined}>
        {label}
      </span>
      {edgeList.map(e => {
        const other = allNodes.find(n => n.id === getOther(e))
        if (!other) return null
        return (
          <div key={e.id} className="connection-pill">
            <span className="parent-checkbox-symbol">{other.data.symbol}</span>
            <span>{other.data.name}</span>
            <button type="button" className="connection-remove-btn" onClick={() => onRemove(e.id)}
              aria-label={`Remove ${other.data.name}`}>×</button>
          </div>
        )
      })}
    </div>
  )
}
