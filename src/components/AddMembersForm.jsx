import { useState, useRef } from 'react'

function DateInput({ value, onChange }) {
  const [mm,   setMm]   = useState(value ? value.slice(5, 7)  : '')
  const [dd,   setDd]   = useState(value ? value.slice(8, 10) : '')
  const [yyyy, setYyyy] = useState(value ? value.slice(0, 4)  : '')
  const ddRef   = useRef()
  const yyyyRef = useRef()

  function emit(m, d, y) {
    if (m.length === 2 && d.length === 2 && y.length === 4) {
      const iso  = `${y}-${m}-${d}`
      const date = new Date(`${iso}T12:00:00`)
      if (!isNaN(date) && date.getMonth() + 1 === parseInt(m) && date.getDate() === parseInt(d)) {
        onChange(iso); return
      }
    }
    onChange('')
  }

  function handleMm(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMm(v); emit(v, dd, yyyy)
    if (v.length === 2) ddRef.current?.focus()
  }
  function handleDd(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setDd(v); emit(mm, v, yyyy)
    if (v.length === 2) yyyyRef.current?.focus()
  }
  function handleYyyy(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
    setYyyy(v); emit(mm, dd, v)
  }

  return (
    <div className="date-input">
      <input type="text" inputMode="numeric" placeholder="MM"
        value={mm} onChange={handleMm} className="row-input date-part" maxLength={2} />
      <span className="date-sep">/</span>
      <input ref={ddRef} type="text" inputMode="numeric" placeholder="DD"
        value={dd} onChange={handleDd} className="row-input date-part" maxLength={2} />
      <span className="date-sep">/</span>
      <input ref={yyyyRef} type="text" inputMode="numeric" placeholder="YYYY"
        value={yyyy} onChange={handleYyyy} className="row-input date-part date-part--year" maxLength={4} />
    </div>
  )
}


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
