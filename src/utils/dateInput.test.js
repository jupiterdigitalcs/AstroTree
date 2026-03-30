import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { expandYear, shouldAdvanceMm, shouldAdvanceDd, buildIso } from './dateInput.js'

// ── expandYear ────────────────────────────────────────────────────────────────

describe('expandYear', () => {
  it('expands 2-digit years in the past (≤ CUR_YY) to 2000s', () => {
    expect(expandYear('00')).toBe('2000')
    expect(expandYear('24')).toBe('2024')
    expect(expandYear('26')).toBe('2026') // current year — in 2000s
  })

  it('expands 2-digit years in the future (> CUR_YY) to 1900s', () => {
    expect(expandYear('27')).toBe('1927')
    expect(expandYear('86')).toBe('1986')
    expect(expandYear('99')).toBe('1999')
  })

  it('passes through 4-digit years unchanged', () => {
    expect(expandYear('1986')).toBe('1986')
    expect(expandYear('2000')).toBe('2000')
    expect(expandYear('2026')).toBe('2026')
  })

  it('passes through incomplete input (1 or 3 digits) unchanged', () => {
    expect(expandYear('5')).toBe('5')
    expect(expandYear('195')).toBe('195')
    expect(expandYear('')).toBe('')
  })
})

// ── shouldAdvanceMm ───────────────────────────────────────────────────────────

describe('shouldAdvanceMm', () => {
  it('returns true when 2 digits entered', () => {
    expect(shouldAdvanceMm('01')).toBe(true)
    expect(shouldAdvanceMm('12')).toBe(true)
    expect(shouldAdvanceMm('11')).toBe(true)
  })

  it('returns true for single digits 2–9 (unambiguous month)', () => {
    expect(shouldAdvanceMm('2')).toBe(true)
    expect(shouldAdvanceMm('3')).toBe(true)
    expect(shouldAdvanceMm('9')).toBe(true)
  })

  it('returns false for "1" (ambiguous: Jan, Oct, Nov, Dec)', () => {
    expect(shouldAdvanceMm('1')).toBe(false)
  })

  it('returns false for "0" (incomplete, no valid month starts with just 0)', () => {
    expect(shouldAdvanceMm('0')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(shouldAdvanceMm('')).toBe(false)
  })
})

// ── shouldAdvanceDd ───────────────────────────────────────────────────────────

describe('shouldAdvanceDd', () => {
  it('returns true when 2 digits entered', () => {
    expect(shouldAdvanceDd('01')).toBe(true)
    expect(shouldAdvanceDd('15')).toBe(true)
    expect(shouldAdvanceDd('31')).toBe(true)
  })

  it('returns true for single digits 4–9 (unambiguous day)', () => {
    expect(shouldAdvanceDd('4')).toBe(true)
    expect(shouldAdvanceDd('5')).toBe(true)
    expect(shouldAdvanceDd('9')).toBe(true)
  })

  it('returns false for single digits 1–3 (ambiguous: could start 10–39)', () => {
    expect(shouldAdvanceDd('1')).toBe(false)
    expect(shouldAdvanceDd('2')).toBe(false)
    expect(shouldAdvanceDd('3')).toBe(false)
  })

  it('returns false for "0" (incomplete)', () => {
    expect(shouldAdvanceDd('0')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(shouldAdvanceDd('')).toBe(false)
  })
})

// ── buildIso ──────────────────────────────────────────────────────────────────

describe('buildIso', () => {
  // Valid dates
  it('builds ISO string from full-digit inputs', () => {
    expect(buildIso('03', '15', '1990')).toBe('1990-03-15')
    expect(buildIso('12', '31', '2000')).toBe('2000-12-31')
  })

  it('pads single-digit month and day', () => {
    expect(buildIso('1', '5', '1985')).toBe('1985-01-05')
    expect(buildIso('3', '9', '2001')).toBe('2001-03-09')
  })

  it('expands 2-digit year', () => {
    expect(buildIso('06', '15', '86')).toBe('1986-06-15')
    expect(buildIso('01', '01', '00')).toBe('2000-01-01')
  })

  it('handles Jan 1 and Dec 31', () => {
    expect(buildIso('1', '1', '2020')).toBe('2020-01-01')
    expect(buildIso('12', '31', '2020')).toBe('2020-12-31')
  })

  // Invalid months
  it('returns null for month 0', () => {
    expect(buildIso('0', '15', '1990')).toBeNull()
    expect(buildIso('00', '15', '1990')).toBeNull()
  })

  it('returns null for month 13', () => {
    expect(buildIso('13', '15', '1990')).toBeNull()
  })

  // Invalid days
  it('returns null for day 0', () => {
    expect(buildIso('01', '0', '1990')).toBeNull()
    expect(buildIso('01', '00', '1990')).toBeNull()
  })

  it('returns null for day 32', () => {
    expect(buildIso('01', '32', '1990')).toBeNull()
  })

  it('returns null for April 31 (month with 30 days)', () => {
    expect(buildIso('4', '31', '2020')).toBeNull()
  })

  it('returns null for Feb 30', () => {
    expect(buildIso('2', '30', '2020')).toBeNull()
  })

  it('returns null for Feb 29 on a non-leap year', () => {
    expect(buildIso('2', '29', '2019')).toBeNull()
    expect(buildIso('2', '29', '1900')).toBeNull() // 1900 not a leap year
  })

  it('accepts Feb 29 on a leap year', () => {
    expect(buildIso('2', '29', '2000')).toBe('2000-02-29') // 2000 is a leap year
    expect(buildIso('2', '29', '2020')).toBe('2020-02-29')
    expect(buildIso('2', '29', '1996')).toBe('1996-02-29')
  })

  // Incomplete input
  it('returns null for incomplete year', () => {
    expect(buildIso('01', '15', '199')).toBeNull()
    expect(buildIso('01', '15', '1')).toBeNull()
    expect(buildIso('01', '15', '')).toBeNull()
  })

  it('returns null for empty month or day', () => {
    expect(buildIso('', '15', '1990')).toBeNull()
    expect(buildIso('01', '', '1990')).toBeNull()
  })
})
