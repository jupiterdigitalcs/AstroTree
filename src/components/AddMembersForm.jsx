import { useState } from 'react'
import { DateInput } from './DateInput.jsx'


const makeRows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: '', birthdate: '' }))

export default function AddMembersForm({ onAdd, initialRows = 2 }) {
  const [rows,       setRows]       = useState(() => makeRows(initialRows))
  const [rowCounter, setRowCounter] = useState(initialRows + 1)
  const [error,      setError]      = useState('')
  // touched tracks which fields the user has blurred on each row
  const [touched,    setTouched]    = useState({})

  function markTouched(id, field) {
    setTouched(prev => ({ ...prev, [id]: { ...prev[id], [field]: true } }))
  }

  function addRow() {
    setRows(prev => [...prev, { id: rowCounter, name: '', birthdate: '' }])
    setRowCounter(c => c + 1)
  }

  function removeRow(id) {
    setRows(prev => prev.length > 1 ? prev.filter(r => r.id !== id) : prev)
  }

  function updateRow(id, field, val) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const valid = rows.filter(r => r.name.trim() && r.birthdate)
    if (!valid.length) { setError('Fill in at least one name and birthdate.'); return }

    onAdd({
      members: valid.map(r => ({ name: r.name.trim(), birthdate: r.birthdate })),
      relationships: {},
    })

    setRows(makeRows(initialRows))
    setRowCounter(initialRows + 1)
    setError('')
    setTouched({})
  }

  const validCount   = rows.filter(r => r.name.trim() && r.birthdate).length
  const namedNoDate  = rows.filter(r => r.name.trim() && !r.birthdate).length

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Add Family Members</h2>

      <div className="member-rows">
        {rows.map((row, idx) => {
          const hasName  = row.name.trim().length > 0
          const hasDate  = row.birthdate.length > 0
          const rowReady = hasName && hasDate
          const nameTouched = touched[row.id]?.name
          const dateTouched = touched[row.id]?.birthdate
          const nameError   = nameTouched && !hasName
          const dateError   = dateTouched && !hasDate
          return (
          <div key={row.id} className={`member-row multi${rowReady ? ' row-ready' : ''}`}>
            <span className="row-num">{idx + 1}</span>

            <input
              className={`row-input${nameError ? ' field-error' : ''}`}
              type="text"
              placeholder="Name"
              value={row.name}
              onChange={e => updateRow(row.id, 'name', e.target.value)}
              onBlur={() => markTouched(row.id, 'name')}
            />

            <DateInput
              key={row.id}
              value={row.birthdate}
              onChange={val => updateRow(row.id, 'birthdate', val)}
              onBlur={() => markTouched(row.id, 'birthdate')}
              hasError={dateError}
            />

            <button
              type="button"
              className="row-remove-btn"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              tabIndex={-1}
              aria-label="Remove"
            >×</button>
          </div>
          )
        })}
      </div>


      <button type="button" className="add-row-btn" onClick={addRow}>
        + Add another person
      </button>

      {namedNoDate > 0 && (
        <p className="form-warning">
          ⚠ {namedNoDate} {namedNoDate === 1 ? 'person needs' : 'people need'} a birthday date to be added
        </p>
      )}
      {error && <p className="form-error">{error}</p>}

      <button type="submit" className="add-btn" disabled={!validCount}>
        {validCount > 1 ? `Add ${validCount} People to Tree` : 'Add to Tree'}
      </button>
    </form>
  )
}
