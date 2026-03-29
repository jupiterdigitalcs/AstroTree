import { useState } from 'react'

const DEFAULT_ROWS = () => [
  { id: 1, name: '', birthdate: '' },
  { id: 2, name: '', birthdate: '' },
  { id: 3, name: '', birthdate: '' },
]

export default function BulkAddForm({ onBulkAdd, onCancel }) {
  const [rows,    setRows]    = useState(DEFAULT_ROWS)
  const [counter, setCounter] = useState(4)

  const addRow = () => {
    setRows(prev => [...prev, { id: counter, name: '', birthdate: '' }])
    setCounter(c => c + 1)
  }

  const removeRow = id => {
    if (rows.length <= 1) return
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const updateRow = (id, field, value) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))

  function handleSubmit(e) {
    e.preventDefault()
    const valid = rows.filter(r => r.name.trim() && r.birthdate)
    if (!valid.length) return
    onBulkAdd(valid.map(r => ({ name: r.name.trim(), birthdate: r.birthdate })))
    setRows(DEFAULT_ROWS())
    setCounter(4)
  }

  const validCount = rows.filter(r => r.name.trim() && r.birthdate).length

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2 className="form-title">✦ Bulk Add</h2>
      <p className="bulk-hint">
        Add multiple people at once — connect relationships later via the edit panel.
      </p>

      <div className="bulk-rows">
        {rows.map((row, i) => (
          <div key={row.id} className="bulk-row">
            <span className="bulk-row-num">{i + 1}</span>
            <input
              type="text"
              placeholder="Name"
              value={row.name}
              onChange={e => updateRow(row.id, 'name', e.target.value)}
              className="bulk-name-input"
            />
            <input
              type="date"
              value={row.birthdate}
              onChange={e => updateRow(row.id, 'birthdate', e.target.value)}
              className="bulk-date-input"
            />
            <button
              type="button"
              className="bulk-remove-btn"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              aria-label="Remove row"
            >×</button>
          </div>
        ))}
      </div>

      <button type="button" className="add-row-btn" onClick={addRow}>+ Add Row</button>

      <button type="submit" className="add-btn" disabled={validCount === 0}>
        {validCount > 0 ? `Add ${validCount} to Tree` : 'Add to Tree'}
      </button>

      <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
    </form>
  )
}
