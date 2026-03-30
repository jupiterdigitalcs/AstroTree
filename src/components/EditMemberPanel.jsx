import { useState } from 'react'
import { DateInput } from './DateInput.jsx'

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
  const [name,          setName]          = useState(node.data.name)
  const [birthdate,     setBirthdate]     = useState(node.data.birthdate)
  const [error,         setError]         = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [addParentId,   setAddParentId]   = useState('')
  const [addChildId,    setAddChildId]    = useState('')
  const [addSpouseId,   setAddSpouseId]   = useState('')

  // ── Derive connections fresh from props every render ──────────────────────
  const parentEdges = edges.filter(e => e.target === node.id && e.data?.relationType !== 'spouse')
  const childEdges  = edges.filter(e => e.source === node.id && e.data?.relationType !== 'spouse')
  const spouseEdges = edges.filter(e =>
    (e.source === node.id || e.target === node.id) && e.data?.relationType === 'spouse'
  )

  const connectedIds = new Set([
    ...parentEdges.map(e => e.source),
    ...childEdges.map(e => e.target),
    ...spouseEdges.map(e => e.source === node.id ? e.target : e.source),
    node.id,
  ])
  const eligibleNodes = allNodes.filter(n => !connectedIds.has(n.id))

  // ── Partner-children suggestion ───────────────────────────────────────────
  // Find children that belong to a spouse but not yet to this node
  const myChildIds = new Set(childEdges.map(e => e.target))
  const partnerChildSuggestions = spouseEdges.flatMap(spouseEdge => {
    const partnerId  = spouseEdge.source === node.id ? spouseEdge.target : spouseEdge.source
    const partner    = allNodes.find(n => n.id === partnerId)
    if (!partner) return []
    return edges
      .filter(e => e.source === partnerId && e.data?.relationType !== 'spouse' && !myChildIds.has(e.target) && e.target !== node.id)
      .map(e => ({ partner, childId: e.target, childNode: allNodes.find(n => n.id === e.target) }))
      .filter(s => s.childNode)
  })

  function handleUpdate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name.'); return }
    if (!birthdate)   { setError('Please pick a birthdate.'); return }
    setError('')
    onUpdate(node.id, { name: name.trim(), birthdate })
  }

  const hasConnections = parentEdges.length > 0 || childEdges.length > 0 ||
                         spouseEdges.length > 0 || eligibleNodes.length > 0

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

          {eligibleNodes.length > 0 && (
            <>
              <AddDropdown placeholder="+ Add parent…"          value={addParentId}  onChange={setAddParentId}
                options={eligibleNodes} onAdd={() => { onAddEdge(addParentId,  node.id);         setAddParentId('') }} />
              <AddDropdown placeholder="+ Add child…"           value={addChildId}   onChange={setAddChildId}
                options={eligibleNodes} onAdd={() => { onAddEdge(node.id, addChildId);            setAddChildId('') }} />
              <AddDropdown placeholder="+ Add spouse/partner…"  value={addSpouseId}  onChange={setAddSpouseId}
                options={eligibleNodes} onAdd={() => { onAddEdge(node.id, addSpouseId, 'spouse'); setAddSpouseId('') }} />
            </>
          )}
        </div>
      )}

      <button type="submit" className="add-btn">Update</button>
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

function AddDropdown({ placeholder, options, value, onChange, onAdd }) {
  return (
    <div className="connection-add-row">
      <select value={value} onChange={e => onChange(e.target.value)} className="connection-add-select">
        <option value="">{placeholder}</option>
        {options.map(n => (
          <option key={n.id} value={n.id}>{n.data.symbol} {n.data.name}</option>
        ))}
      </select>
      <button type="button" className="connection-add-btn" disabled={!value} onClick={onAdd}>Add</button>
    </div>
  )
}
