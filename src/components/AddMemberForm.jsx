import { useState } from 'react'

// Controlled picker — no internal state so parent reset clears it completely
function RelPicker({ label, selectedIds, selectValue, onSelectChange, onAdd, onRemove, options }) {
  const available = options.filter(n => !selectedIds.includes(n.id))

  return (
    <div className="rel-picker">
      <span className="parent-select-label">{label}</span>

      {selectedIds.length > 0 && (
        <div className="rel-pills">
          {selectedIds.map(id => {
            const n = options.find(x => x.id === id)
            return n ? (
              <span key={id} className="rel-pill">
                {n.data.symbol} {n.data.name}
                <button type="button" onClick={() => onRemove(id)}>×</button>
              </span>
            ) : null
          })}
        </div>
      )}

      {available.length > 0 && (
        <div className="connection-add-row">
          <select
            value={selectValue}
            onChange={e => onSelectChange(e.target.value)}
            className="connection-add-select"
          >
            <option value="">Select…</option>
            {available.map(n => (
              <option key={n.id} value={n.id}>
                {n.data.symbol} {n.data.name}
              </option>
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
  const [name,         setName]         = useState('')
  const [birthdate,    setBirthdate]    = useState('')
  const [parentIds,    setParentIds]    = useState([])
  const [childIds,     setChildIds]     = useState([])
  const [spouseIds,    setSpouseIds]    = useState([])
  const [addParentId,  setAddParentId]  = useState('')
  const [addChildId,   setAddChildId]   = useState('')
  const [addSpouseId,  setAddSpouseId]  = useState('')
  const [error,        setError]        = useState('')

  const allSelectedIds = new Set([...parentIds, ...childIds, ...spouseIds])
  const availableNodes = existingNodes.filter(n => !allSelectedIds.has(n.id))

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter a name.'); return }
    if (!birthdate)   { setError('Please pick a birthdate.'); return }
    setError('')
    onAdd({ name: name.trim(), birthdate, parentIds, childIds, spouseIds })
    setName('')
    setBirthdate('')
    setParentIds([]);  setAddParentId('')
    setChildIds([]);   setAddChildId('')
    setSpouseIds([]);  setAddSpouseId('')
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
            options={availableNodes}
            onAdd={id  => setParentIds(prev => [...prev, id])}
            onRemove={id => setParentIds(prev => prev.filter(p => p !== id))}
          />
          <RelPicker
            label={`Child(ren) of ${name || 'this person'}`}
            selectedIds={childIds}
            selectValue={addChildId}
            onSelectChange={setAddChildId}
            options={availableNodes}
            onAdd={id  => setChildIds(prev => [...prev, id])}
            onRemove={id => setChildIds(prev => prev.filter(c => c !== id))}
          />
          <RelPicker
            label="Spouse / Partner"
            selectedIds={spouseIds}
            selectValue={addSpouseId}
            onSelectChange={setAddSpouseId}
            options={availableNodes}
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
