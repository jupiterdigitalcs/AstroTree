// Pure date-input helpers — no browser/React dependencies

const CUR_YY = new Date().getFullYear() % 100

/**
 * Expand a 2-digit year string to 4 digits.
 * '86' → '1986', '24' → '2024', '1986' → '1986' (unchanged)
 */
export function expandYear(y) {
  if (y.length !== 2) return y
  const n = parseInt(y, 10)
  return (n <= CUR_YY ? 2000 + n : 1900 + n).toString()
}

/**
 * Should the MM field auto-advance after the user typed `v`?
 * Months 2–9 are unambiguous as single digits; 1 could be Jan, Oct, Nov, or Dec.
 */
export function shouldAdvanceMm(v) {
  if (v.length === 2) return true
  if (v.length === 1 && parseInt(v, 10) >= 2) return true
  return false
}

/**
 * Should the DD field auto-advance after the user typed `v`?
 * Days 4–9 are unambiguous as single digits; 1–3 could each start a 2-digit day.
 */
export function shouldAdvanceDd(v) {
  if (v.length === 2) return true
  if (v.length === 1 && parseInt(v, 10) >= 4) return true
  return false
}

/**
 * Build and validate an ISO date string from raw (possibly single-digit) inputs.
 * Returns the ISO string (YYYY-MM-DD) if valid, or null if invalid/incomplete.
 */
export function buildIso(m, d, y) {
  const pm = m.padStart(2, '0')
  const pd = d.padStart(2, '0')
  const fy = expandYear(y)
  if (pm.length !== 2 || pd.length !== 2 || fy.length !== 4) return null
  const iso  = `${fy}-${pm}-${pd}`
  const date = new Date(`${iso}T12:00:00`)
  if (
    !isNaN(date) &&
    date.getMonth() + 1 === parseInt(pm, 10) &&
    date.getDate()      === parseInt(pd, 10)
  ) return iso
  return null
}
