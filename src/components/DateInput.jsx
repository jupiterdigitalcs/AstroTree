import { useState, useRef } from 'react'

export function DateInput({ value, onChange }) {
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
