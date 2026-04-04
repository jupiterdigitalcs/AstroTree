import { useState, useMemo } from 'react'
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
}) {
  const [name,           setName]           = useState(node.data.name)
  const [birthdate,      setBirthdate]      = useState(node.data.birthdate)
  const [birthTime,      setBirthTime]      = useState(node.data.birthTime ?? '')
  const [exactBirthTime, setExactBirthTime] = useState(node.data.exactBirthTime ?? false)
  const [isEditingTime,  setIsEditingTime]  = useState(false)
  const [error,          setError]          = useState('')

  // Warnings based on birthdate only (no birth time) — used to know whether to show the time field
  const originalWarnings = useMemo(
    () => birthdate ? checkIngressWarnings(birthdate) : [],
    [birthdate]
  )
  // Active warnings respect birth time — clears when a time is entered
  const ingressWarnings = useMemo(
    () => checkIngressWarnings(birthdate, birthTime || null),
    [birthdate, birthTime]
  )

  // Detect if entered birth time is a round hour very close to an ingress
  const showExactCheckbox = useMemo(() => {
    if (!birthTime || !originalWarnings.length) return false
    const [h, m] = birthTime.split(':').map(Number)
    if (m !== 0) return false
    return originalWarnings.some(w => Math.abs(h - w.ingressHour) <= 1)
  }, [birthTime, originalWarnings])

  // Show the expanded time-entry form when: actively editing, OR no time set yet and warnings exist
  const showTimeEditor = isEditingTime || (!birthTime && originalWarnings.length > 0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [connectTo,     setConnectTo]     = useState(null) // id of node being connected

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
  const eligibleNodes = allNodes.filter(n => !connectedIds.has(n.id))

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
      types.push({ key: 'parent', label: 'Parent of me', action: () => onAddEdge(otherId, node.id) })
    }

    // My child: only if other has < 2 parents, and other is not my ancestor
    if (parentCountOf(otherId) < 2 && !ancestors.has(otherId)) {
      types.push({ key: 'child', label: 'My child', action: () => onAddEdge(node.id, otherId) })
    }

    // Spouse: always valid (non-hierarchical)
    types.push({ key: 'spouse', label: 'Spouse / partner', action: () => onAddEdge(node.id, otherId, 'spouse') })

    // Friend: always valid
    types.push({ key: 'friend', label: 'Friend', action: () => onAddEdge(node.id, otherId, 'friend') })

    // Coworker: always valid
    types.push({ key: 'coworker', label: 'Coworker', action: () => onAddEdge(node.id, otherId, 'coworker') })

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

  function handleUpdate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name.'); return }
    if (!birthdate)   { setError('Please pick a birthdate.'); return }
    setError('')
    onUpdate(node.id, { name: name.trim(), birthdate, birthTime: birthTime || null, exactBirthTime })
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
    <form className="add-form edit-panel" onSubmit={handleUpdate}>
      <h2 className="form-title">✦ Edit Member</h2>

      <label>
        Name
        <input type="text" value={name} onChange={e => setName(e.target.value)} />
      </label>

      <label>
        Birthdate
        <DateInput value={birthdate} onChange={setBirthdate} />
      </label>

      {/* ── Birth time ────────────────────────────────────────────────────── */}
      {originalWarnings.length > 0 && (
        showTimeEditor ? (
          /* Expanded — time input + planet context */
          <div className={`ingress-warning${birthTime && !ingressWarnings.length ? ' ingress-warning--resolved' : ''}`}>
            <span className="ingress-warning-icon">{birthTime && !ingressWarnings.length ? '✓' : '⚠'}</span>
            <div className="ingress-warning-body">
              <span className={`ingress-warning-title${birthTime && !ingressWarnings.length ? ' ingress-warning-title--ok' : ''}`}>
                {birthTime && !ingressWarnings.length
                  ? 'Sign confirmed for this time'
                  : `${originalWarnings.length} planet${originalWarnings.length > 1 ? 's' : ''} change sign on this date`}
              </span>

              {/* Planet ingress details — always visible while editing so user knows the relevant range */}
              {originalWarnings.map(w => (
                <span key={w.name} className="ingress-warning-planet">
                  <PlanetSign planet={w.planet} sign={w.signStart} />
                  <span className="ingress-warning-arrow">→</span>
                  <PlanetSign planet={w.planet} sign={w.signEnd} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                    ({w.name} changes at {w.ingressTime})
                  </span>
                </span>
              ))}

              <label className="birthtime-label">
                Birth time
                <input
                  type="time"
                  className="row-input birthtime-input"
                  value={birthTime}
                  onChange={e => { setBirthTime(e.target.value); setExactBirthTime(false) }}
                />
              </label>

              {showExactCheckbox && (
                <label className="birthtime-exact-label">
                  <input
                    type="checkbox"
                    checked={exactBirthTime}
                    onChange={e => setExactBirthTime(e.target.checked)}
                    style={{ accentColor: 'var(--gold)' }}
                  />
                  This time is exact — birth was right at {birthTime}
                  <span className="ingress-warning-note" style={{ fontStyle: 'normal' }}>
                    (Round number close to a sign change — confirm from records if unsure)
                  </span>
                </label>
              )}

              {birthTime && isEditingTime && (
                <button type="button" className="birthtime-done-btn" onClick={() => setIsEditingTime(false)}>
                  Done
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Collapsed — just show the saved time with an Edit button */
          <div className="ingress-warning ingress-warning--resolved">
            <span className="ingress-warning-icon">✓</span>
            <div className="ingress-warning-body">
              <div className="birthtime-saved-row">
                <span className="ingress-warning-title ingress-warning-title--ok">
                  Birth time: {birthTime}
                </span>
                <button
                  type="button"
                  className="birthtime-edit-btn"
                  onClick={() => setIsEditingTime(true)}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Plain field — no ingress warning, but birth time already saved */}
      {!originalWarnings.length && (
        birthTime ? (
          <label>
            Birth time
            <input
              type="time"
              className="row-input birthtime-input"
              value={birthTime}
              onChange={e => setBirthTime(e.target.value)}
            />
          </label>
        ) : null
      )}

      {error && <p className="form-error">{error}</p>}

      {/* ── Connections ─────────────────────────────────────────────────── */}
      {hasConnections && (
        <div className="connections-section">
          <span className="parent-select-label">Connections</span>

          {parentEdges.length > 0 && (
            <ConnGroup label="Parents" edgeList={parentEdges}
              getOther={e => e.source} allNodes={allNodes} onRemove={onRemoveEdge} />
          )}
          {childEdges.length > 0 && (
            <ConnGroup label="Children" edgeList={childEdges}
              getOther={e => e.target} allNodes={allNodes} onRemove={onRemoveEdge} />
          )}
          {spouseEdges.length > 0 && (
            <ConnGroup label="Spouse / Partner" edgeList={spouseEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={onRemoveEdge} accentColor="#e879a8" />
          )}
          {friendEdges.length > 0 && (
            <ConnGroup label="Friends" edgeList={friendEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={onRemoveEdge} accentColor="#5bc8f5" />
          )}
          {coworkerEdges.length > 0 && (
            <ConnGroup label="Coworkers" edgeList={coworkerEdges}
              getOther={e => e.source === node.id ? e.target : e.source}
              allNodes={allNodes} onRemove={onRemoveEdge} accentColor="#a0a0b8" />
          )}

          {/* Partner-children quick-connect */}
          {partnerChildSuggestions.length > 0 && (
            <button
              type="button"
              className="suggestion-btn"
              onClick={() => partnerChildSuggestions.forEach(s => onAddEdge(node.id, s.childId))}
            >
              + Also parent of {partnerChildSuggestions[0].partner.data.name}'s{' '}
              {partnerChildSuggestions.length === 1
                ? partnerChildSuggestions[0].childNode.data.name
                : `${partnerChildSuggestions.length} children`}
            </button>
          )}

          {/* ── Add connection: step 1 — pick a person ──────────────────── */}
          {eligibleNodes.length > 0 && !connectTo && (
            <div className="connection-add-row">
              <select
                value=""
                className="connection-add-select"
                onChange={e => {
                  if (!e.target.value) return
                  handleConnect(e.target.value)
                }}
              >
                <option value="">＋ Add connection…</option>
                {eligibleNodes.map(n => (
                  <option key={n.id} value={n.id}>{n.data.symbol} {n.data.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Add connection: step 2 — pick relationship type ─────────── */}
          {connectTarget && (
            <div className="connection-type-picker">
              <div className="connection-type-header">
                <span>
                  Connect to <strong>{connectTarget.data.symbol} {connectTarget.data.name}</strong> as:
                </span>
                <button type="button" className="connection-type-cancel" onClick={() => setConnectTo(null)}>✕</button>
              </div>
              <div className="connection-type-options">
                {connectOptions.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`connection-type-btn connection-type-btn--${opt.key}`}
                    onClick={() => { opt.action(); setConnectTo(null) }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="add-btn">Save</button>
      <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>

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
    </form>
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
