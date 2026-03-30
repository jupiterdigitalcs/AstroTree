import { useState, useRef } from 'react'

// '86' → 1986, '24' → 2024 (anything ≤ current 2-digit year → 2000s)
const CUR_YY = new Date().getFullYear() % 100

function expandYear(y) {
  if (y.length !== 2) return y
  const n = parseInt(y, 10)
  return (n <= CUR_YY ? 2000 + n : 1900 + n).toString()
}

export function DateInput({ value, onChange }) {
  const [mm,   setMm]   = useState(value ? value.slice(5, 7)  : '')
  const [dd,   setDd]   = useState(value ? value.slice(8, 10) : '')
  const [yyyy, setYyyy] = useState(value ? value.slice(0, 4)  : '')
  const ddRef   = useRef()
  const yyyyRef = useRef()

  function emit(m, d, y) {
    // Pad single-digit month/day so '1' = January, '5' = 5th
    const pm = m.padStart(2, '0')
    const pd = d.padStart(2, '0')
    const fy = expandYear(y)
    if (pm.length === 2 && pd.length === 2 && fy.length === 4) {
      const iso  = `${fy}-${pm}-${pd}`
      const date = new Date(`${iso}T12:00:00`)
      if (!isNaN(date) && date.getMonth() + 1 === parseInt(pm) && date.getDate() === parseInt(pd)) {
        onChange(iso); return
      }
    }
    onChange('')
  }

  function handleMm(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setMm(v)
    emit(v, dd, yyyy)
    // Months 2–9 are unambiguous single-digit; advance immediately
    // Month 1 is ambiguous (could be 1, 10, 11, 12) — wait for second digit
    if (v.length === 2 || (v.length === 1 && parseInt(v, 10) >= 2)) {
      ddRef.current?.focus()
    }
  }

  function handleDd(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2)
    setDd(v)
    emit(mm, v, yyyy)
    // Days 4–9 are unambiguous single-digit; advance immediately
    if (v.length === 2 || (v.length === 1 && parseInt(v, 10) >= 4)) {
      yyyyRef.current?.focus()
    }
  }

  function handleYyyy(e) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4)
    setYyyy(v)
    emit(mm, dd, v)
  }

  function handleYyyyBlur() {
    // Expand 2-digit year on blur: '86' → '1986'
    if (yyyy.length === 2) {
      const expanded = expandYear(yyyy)
      setYyyy(expanded)
      emit(mm, dd, expanded)
    }
  }

  return (
    <div className="date-input">
      <input type="text" inputMode="numeric" placeholder="MM"
        value={mm} onChange={handleMm}
        className="row-input date-part" maxLength={2} />
      <span className="date-sep">/</span>
      <input ref={ddRef} type="text" inputMode="numeric" placeholder="DD"
        value={dd} onChange={handleDd}
        className="row-input date-part" maxLength={2} />
      <span className="date-sep">/</span>
      <input ref={yyyyRef} type="text" inputMode="numeric" placeholder="YYYY"
        value={yyyy} onChange={handleYyyy} onBlur={handleYyyyBlur}
        className="row-input date-part date-part--year" maxLength={4} />
    </div>
  )
}
