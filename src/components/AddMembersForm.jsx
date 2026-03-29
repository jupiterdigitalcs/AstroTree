import { useState } from 'react'

function RelPicker({ label, selectedIds, selectValue, onSelectChange, onAdd, onRemove, allNodes, excludeIds }) {
  const options = allNodes.filter(n => !selectedIds.includes(n.id) && !excludeIds.has(n.id))

  return (
    <div className="rel-picker">
      <span className="parent-select-label">{label}</span>

      {selectedIds.length > 0 && (
        <div className="rel-pills">
          {selectedIds.map(id => {
            const n = allNodes.find(x => x.id === id)
            return n ? (
              <span key={id} className="rel-pill">
                {n.data.symbol} {n.data.name}
                <button type="button" onClick={() => onRemove(id)}>×</button>
              </span>
            ) : null
          })}
        </div>
      )}

      {options.length > 0 && (
        <div className="connection-add-row">
          <select
            className="connection-add-select"
            value={selectValue}
            onChange={e => onSelectChange(e.target.value)}
          >
            <option value="">Select…</option>
            {options.map(n => (
              <option key={n.id} value={n.id}>{n.data.symbol} {n.data.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="connection-add-btn"
            disabled={!selectValue}
            onClick={() => { onAdd(selectValue); onSelectChange('') }}
          >Add</button>
        </div>
      )}
    </div>
  )
}

export default function AddMembersForm({ onAdd, existingNodes = [] }) {
  const [rows,       setRows]       = useState([{ id: 1, name: '', birthdate: '' }])
  const [rowCounter, setRowCounter] = useState(2)
  const [parentIds,  setParentIds]  = useState([])
  const [childIds,   setChildIds]   = useState([])
  const [spouseIds,  setSpouseIds]  = useState([])
  const [selParent,  setSelParent]  = useState('')
  const [selChild,   setSelChild]   = useState('')
  const [selSpouse,  setSelSpouse]  = useState('')
  const [error,      setError]      = useState('')

  const isMulti      = rows.length > 1
  const allSelectedIds = new Set([...parentIds, ...childIds, ...spouseIds])

  function addRow() {
    setRows(prev => [...prev, { id: rowCounter, name: '', birthdate: '' }])
    setRowCounter(c => c + 1)
  }

  function removeRow(id) {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRow(id, field, val) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const valid = rows.filter(r => r.name.trim() && r.birthdate)
    if (!valid.length) { setError('Please fill in at least one name and birthdate.'); return }

    onAdd({
      members: valid.map(r => ({ name: r.name.trim(), birthdate: r.birthdate })),
      relationships: { parentIds, childIds, spouseIds },
    })

    setRows([{ id: rowCounter, name: '', birthdate: '' }])
    setRowCounter(c => c + 1)
    setParentIds([]); setChildIds([]); setSpouseIds([])
    setSelParent(''); setSelChild(''); setSelSpouse('')
    setError('')
  }

  const validCount = rows.filter(r => r.name.trim() && r.birthdate).length
  const firstName  = rows[0]?.name || 'this person'

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Add Family Members</h2>

      <div className="member-rows">
        {rows.map((row, idx) => (
          <div key={row.id} className={`member-row ${isMulti ? 'multi' : 'single'}`}>
            {isMulti && <span className="row-num">{idx + 1}</span>}

            <input
              className="row-input"
              type="text"
              placeholder="Name"
              value={row.name}
              onChange={e => updateRow(row.id, 'name', e.target.value)}
            />

            {isMulti ? (
              <input
                className="row-input"
                type="date"
                value={row.birthdate}
                onChange={e => updateRow(row.id, 'birthdate', e.target.value)}
              />
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)' }}>Birthdate</span>
                <input
                  className="row-input"
                  type="date"
                  value={row.birthdate}
                  onChange={e => updateRow(row.id, 'birthdate', e.target.value)}
                />
              </label>
            )}

            {isMulti && (
              <button
                type="button"
                className="row-remove-btn"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
                aria-label="Remove"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {/* Relationship pickers — only for the primary (first) person */}
      {!isMulti && existingNodes.length > 0 && (
        <div className="rel-pickers">
          <RelPicker
            label={`Parents of ${firstName}`}
            selectedIds={parentIds}  selectValue={selParent}
            onSelectChange={setSelParent}
            allNodes={existingNodes}  excludeIds={allSelectedIds}
            onAdd={id => setParentIds(p => [...p, id])}
            onRemove={id => setParentIds(p => p.filter(x => x !== id))}
          />
          <RelPicker
            label={`Children of ${firstName}`}
            selectedIds={childIds}  selectValue={selChild}
            onSelectChange={setSelChild}
            allNodes={existingNodes}  excludeIds={allSelectedIds}
            onAdd={id => setChildIds(p => [...p, id])}
            onRemove={id => setChildIds(p => p.filter(x => x !== id))}
          />
          <RelPicker
            label="Spouse / Partner"
            selectedIds={spouseIds}  selectValue={selSpouse}
            onSelectChange={setSelSpouse}
            allNodes={existingNodes}  excludeIds={allSelectedIds}
            onAdd={id => setSpouseIds(p => [...p, id])}
            onRemove={id => setSpouseIds(p => p.filter(x => x !== id))}
          />
        </div>
      )}

      {isMulti && (
        <p className="multi-hint">Relationships can be set from the edit panel after adding.</p>
      )}

      <button type="button" className="add-row-btn" onClick={addRow}>
        + Add another person
      </button>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="add-btn" disabled={!validCount}>
        {validCount > 1 ? `Add ${validCount} People to Tree` : 'Add to Tree'}
      </button>
    </form>
  )
}
