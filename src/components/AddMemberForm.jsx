import { useState } from 'react'

// Fully controlled — no internal state, so parent reset clears everything
function RelPicker({ label, selectedIds, selectValue, onSelectChange, onAdd, onRemove, allNodes, excludeIds }) {
  // Pills look up from allNodes (full list — not filtered out when selected)
  // Dropdown only shows nodes not already selected anywhere
  const dropdownOptions = allNodes.filter(n => !selectedIds.includes(n.id) && !excludeIds.has(n.id))

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

      {dropdownOptions.length > 0 && (
        <div className="connection-add-row">
          <select
            value={selectValue}
            onChange={e => onSelectChange(e.target.value)}
            className="connection-add-select"
          >
            <option value="">Select…</option>
            {dropdownOptions.map(n => (
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

export default function AddMemberForm({ onAdd, existingNodes = [] }) {
  const [name,        setName]        = useState('')
  const [birthdate,   setBirthdate]   = useState('')
  const [parentIds,   setParentIds]   = useState([])
  const [childIds,    setChildIds]    = useState([])
  const [spouseIds,   setSpouseIds]   = useState([])
  const [addParentId, setAddParentId] = useState('')
  const [addChildId,  setAddChildId]  = useState('')
  const [addSpouseId, setAddSpouseId] = useState('')
  const [error,       setError]       = useState('')

  const allSelectedIds = new Set([...parentIds, ...childIds, ...spouseIds])

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name.'); return }
    if (!birthdate)   { setError('Please pick a birthdate.'); return }
    setError('')
    onAdd({ name: name.trim(), birthdate, parentIds, childIds, spouseIds })
    setName('');        setBirthdate('')
    setParentIds([]);   setAddParentId('')
    setChildIds([]);    setAddChildId('')
    setSpouseIds([]);   setAddSpouseId('')
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2 className="form-title">✦ Add Family Member</h2>

      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Luna"
        />
      </label>

      <label>
        Birthdate
        <input
          type="date"
          value={birthdate}
          onChange={e => setBirthdate(e.target.value)}
        />
      </label>

      {existingNodes.length > 0 && (
        <div className="rel-pickers">
          <RelPicker
            label={`Parent(s) of ${name || 'this person'}`}
            selectedIds={parentIds}
            selectValue={addParentId}
            onSelectChange={setAddParentId}
            allNodes={existingNodes}
            excludeIds={allSelectedIds}
            onAdd={id  => setParentIds(prev => [...prev, id])}
            onRemove={id => setParentIds(prev => prev.filter(p => p !== id))}
          />
          <RelPicker
            label={`Child(ren) of ${name || 'this person'}`}
            selectedIds={childIds}
            selectValue={addChildId}
            onSelectChange={setAddChildId}
            allNodes={existingNodes}
            excludeIds={allSelectedIds}
            onAdd={id  => setChildIds(prev => [...prev, id])}
            onRemove={id => setChildIds(prev => prev.filter(c => c !== id))}
          />
          <RelPicker
            label="Spouse / Partner"
            selectedIds={spouseIds}
            selectValue={addSpouseId}
            onSelectChange={setAddSpouseId}
            allNodes={existingNodes}
            excludeIds={allSelectedIds}
            onAdd={id  => setSpouseIds(prev => [...prev, id])}
            onRemove={id => setSpouseIds(prev => prev.filter(s => s !== id))}
          />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="add-btn">Add to Tree</button>
    </form>
  )
}
