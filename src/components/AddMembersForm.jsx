import { useState } from 'react'
import { DateInput } from './DateInput.jsx'


const INITIAL_ROWS = () => [
  { id: 1, name: '', birthdate: '' },
  { id: 2, name: '', birthdate: '' },
  { id: 3, name: '', birthdate: '' },
]

export default function AddMembersForm({ onAdd }) {
  const [rows,       setRows]       = useState(INITIAL_ROWS)
  const [rowCounter, setRowCounter] = useState(4)
  const [error,      setError]      = useState('')

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

    setRows(INITIAL_ROWS())
    setRowCounter(4)
    setError('')
  }

  const validCount = rows.filter(r => r.name.trim() && r.birthdate).length

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Add Family Members</h2>

      <div className="member-rows">
        {rows.map((row, idx) => (
          <div key={row.id} className="member-row multi">
            <span className="row-num">{idx + 1}</span>

            <input
              className="row-input"
              type="text"
              placeholder="Name"
              value={row.name}
              onChange={e => updateRow(row.id, 'name', e.target.value)}
            />

            <DateInput
              key={row.id}
              value={row.birthdate}
              onChange={val => updateRow(row.id, 'birthdate', val)}
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
        ))}
      </div>


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
