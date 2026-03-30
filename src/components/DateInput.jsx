import { useState, useRef } from 'react'
import { expandYear, shouldAdvanceMm, shouldAdvanceDd, buildIso } from '../utils/dateInput.js'

export function DateInput({ value, onChange, onBlur, hasError }) {
  const [mm,   setMm]   = useState(value ? value.slice(5, 7)  : '')
  const [dd,   setDd]   = useState(value ? value.slice(8, 10) : '')
  const [yyyy, setYyyy] = useState(value ? value.slice(0, 4)  : '')
  const ddRef      = useRef()
  const yyyyRef    = useRef()
  const containerRef = useRef()

  function emit(m, d, y) {
    const iso = buildIso(m, d, y)
    onChange(iso ?? '')
  }

  function handleMm(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMm(v)
    emit(v, dd, yyyy)
    if (shouldAdvanceMm(v)) ddRef.current?.focus()
  }

  function handleDd(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setDd(v)
    emit(mm, v, yyyy)
    if (shouldAdvanceDd(v)) yyyyRef.current?.focus()
  }

  function handleYyyy(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
    setYyyy(v)
    emit(mm, dd, v)
  }

  function handleYyyyBlur() {
    if (yyyy.length === 2) {
      const expanded = expandYear(yyyy)
      setYyyy(expanded)
      emit(mm, dd, expanded)
    }
    // Fire onBlur after any year-expansion emit settles
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        onBlur?.()
      }
    }, 0)
  }

  function handleInnerBlur() {
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        onBlur?.()
      }
    }, 0)
  }

  return (
    <div ref={containerRef} className={`date-input${hasError ? ' field-error' : ''}`}>
      <input type="text" inputMode="numeric" placeholder="MM"
        value={mm} onChange={handleMm} onBlur={handleInnerBlur}
        className="row-input date-part" maxLength={2} />
      <span className="date-sep">/</span>
      <input ref={ddRef} type="text" inputMode="numeric" placeholder="DD"
        value={dd} onChange={handleDd} onBlur={handleInnerBlur}
        className="row-input date-part" maxLength={2} />
      <span className="date-sep">/</span>
      <input ref={yyyyRef} type="text" inputMode="numeric" placeholder="YYYY"
        value={yyyy} onChange={handleYyyy} onBlur={handleYyyyBlur}
        className="row-input date-part date-part--year" maxLength={4} />
    </div>
  )
}
