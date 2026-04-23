import { useState, useRef, useMemo } from 'react'
import { DateInput } from './DateInput.jsx'


const makeRow = (id, defaultRelatedTo) => ({ id, name: '', birthdate: '', relatedTo: defaultRelatedTo || '', relationType: 'child' })
const makeRows = (n, defaultRelatedTo) => Array.from({ length: n }, (_, i) => makeRow(i + 1, defaultRelatedTo))

export default function AddMembersForm({ onAdd, initialRows = 2, existingNodes = [], existingEdges = [] }) {
  const defaultRelatedTo = existingNodes.length > 0 ? existingNodes[0].id : ''
  const [rows,       setRows]       = useState(() => makeRows(initialRows, defaultRelatedTo))
  const [rowCounter, setRowCounter] = useState(initialRows + 1)
  const [error,      setError]      = useState('')
  const [touched,    setTouched]    = useState({})
  const formRef = useRef(null)

  const hasExisting = existingNodes.length > 0

  // Build smart relationship types based on who the new person is being related to
  function getRelTypesFor(relatedToId) {
    if (!relatedToId) return []
    const hasPartner = existingEdges.some(e =>
      e.data?.relationType === 'spouse' && (e.source === relatedToId || e.target === relatedToId)
    )
    const parentCount = existingEdges.filter(e =>
      e.data?.relationType === 'parent-child' && e.target === relatedToId
    ).length

    const family = []
    family.push({ value: 'child', label: 'Child' })
    if (parentCount < 2) family.push({ value: 'parent', label: 'Parent' })
    family.push({ value: 'sibling', label: 'Sibling' })
    if (!hasPartner) family.push({ value: 'spouse', label: 'Partner' })

    const other = []
    if (hasPartner) other.push({ value: 'spouse', label: 'Partner' })
    other.push({ value: 'step-parent', label: 'Step-Parent' })
    other.push({ value: 'step-child', label: 'Step-Child' })
    other.push({ value: 'friend', label: 'Friend' })
    other.push({ value: 'coworker', label: 'Coworker' })

    if (other.length > 0) {
      return [...family, { value: '_sep', separator: true }, ...other]
    }
    return family
  }

  function markTouched(id, field) {
    setTouched(prev => ({ ...prev, [id]: { ...prev[id], [field]: true } }))
  }

  function addRow() {
    setRows(prev => [...prev, makeRow(rowCounter, defaultRelatedTo)])
    setRowCounter(c => c + 1)
    setTimeout(() => {
      const btn = formRef.current?.querySelector('.add-btn')
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
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

    const memberRelationships = valid.map(r => {
      if (!r.relatedTo) return null
      return { relatedTo: r.relatedTo, relationType: r.relationType }
    })

    onAdd({
      members: valid.map(r => ({ name: r.name.trim(), birthdate: r.birthdate, birthTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone })),
      relationships: {},
      memberRelationships,
    })

    setRows(makeRows(initialRows, defaultRelatedTo))
    setRowCounter(initialRows + 1)
    setError('')
    setTouched({})
  }

  const validCount   = rows.filter(r => r.name.trim() && r.birthdate).length
  const namedNoDate  = rows.filter(r => r.name.trim() && !r.birthdate).length

  // Find the name of the related-to person for display
  function relatedName(nodeId) {
    const n = existingNodes.find(x => x.id === nodeId)
    return n?.data?.name || ''
  }

  return (
    <form className="add-form" ref={formRef} onSubmit={handleSubmit}>
      <h2 className="form-title">{hasExisting ? 'Add More People' : 'Add Family Members'}</h2>

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
              onComplete={() => {
                const nextRow = rows[idx + 1]
                if (nextRow) {
                  const el = document.querySelector(`.member-row:nth-child(${idx + 2}) input[type="text"]`)
                  el?.focus()
                }
              }}
            />

            <button
              type="button"
              className="row-remove-btn"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              tabIndex={-1}
              aria-label="Remove"
            >×</button>

            {hasExisting && (
              <div className="row-relationship">
                <div className="row-rel-pills">
                  {getRelTypesFor(row.relatedTo).map(t =>
                    t.separator ? (
                      <span key={t.value} className="row-rel-sep" />
                    ) : (
                      <button
                        key={t.value}
                        type="button"
                        className={`row-rel-pill${row.relationType === t.value ? ' row-rel-pill--active' : ''}`}
                        onClick={() => updateRow(row.id, 'relationType', t.value)}
                      >{t.label}</button>
                    )
                  )}
                </div>
                <div className="row-rel-target">
                  <span className="row-rel-of">of</span>
                  {existingNodes.length <= 6 ? (
                    <div className="row-rel-people-pills">
                      {existingNodes.map(n => (
                        <button
                          key={n.id}
                          type="button"
                          className={`row-rel-person-pill${row.relatedTo === n.id ? ' row-rel-person-pill--active' : ''}`}
                          onClick={() => updateRow(row.id, 'relatedTo', n.id)}
                        >
                          <span className="row-rel-person-symbol">{n.data.symbol}</span>
                          {n.data.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button type="button" className="row-rel-select-btn" onClick={() => {
                      // Cycle through a simple dropdown approach for 7+ people
                      const el = formRef.current?.querySelector(`[data-rel-select="${row.id}"]`)
                      el?.showPicker?.() || el?.focus()
                    }}>
                      <span className="row-rel-select-value">
                        {row.relatedTo ? `${relatedName(row.relatedTo)}` : '— select —'}
                      </span>
                      <span className="row-rel-select-arrow">▾</span>
                      <select
                        data-rel-select={row.id}
                        className="row-rel-select-hidden"
                        value={row.relatedTo}
                        onChange={e => updateRow(row.id, 'relatedTo', e.target.value)}
                      >
                        {existingNodes.map(n => (
                          <option key={n.id} value={n.id}>{n.data.name}</option>
                        ))}
                      </select>
                    </button>
                  )}
                </div>
              </div>
            )}
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
