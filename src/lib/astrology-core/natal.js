/**
 * natal.js — Server-side natal chart calculations
 *
 * Wraps Celestine so the rest of the app never imports it directly.
 * If Celestine is ever replaced, this is the only file that changes.
 *
 * All functions are pure: (birthdate, birthTime?, tz?) → data
 */

import { calculateChart } from 'celestine'

// ── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_HOUR     = 12
export const DEFAULT_MINUTE   = 0
export const DEFAULT_TIMEZONE = -5   // EST fallback when no timezone given
export const DEFAULT_LAT      = 40.7128
export const DEFAULT_LON      = -74.0060

export const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

const INGRESS_PLANETS = [
  { name: 'Sun',     glyph: '☀', planet: 'sun',     index: 0 },
  { name: 'Moon',    glyph: '☽', planet: 'moon',    index: 1 },
  { name: 'Mercury', glyph: '☿', planet: 'mercury', index: 2 },
  { name: 'Venus',   glyph: '♀', planet: 'venus',   index: 3 },
  { name: 'Mars',    glyph: '♂', planet: 'mars',    index: 4 },
]

const TZ_SENSITIVE_PLANETS = [
  { name: 'Moon',    glyph: '☽', planet: 'moon',    index: 1 },
  { name: 'Sun',     glyph: '☀', planet: 'sun',     index: 0 },
  { name: 'Mercury', glyph: '☿', planet: 'mercury', index: 2 },
  { name: 'Venus',   glyph: '♀', planet: 'venus',   index: 3 },
  { name: 'Mars',    glyph: '♂', planet: 'mars',    index: 4 },
]

// ── Low-level helpers ────────────────────────────────────────────────────────

/** Convert IANA timezone string → numeric UTC offset for a specific date (DST-aware) */
export function ianaToOffset(ianaTz, birthdate) {
  if (!ianaTz || typeof ianaTz !== 'string') return DEFAULT_TIMEZONE
  try {
    const [year, month, day] = birthdate.split('-').map(Number)
    const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTz,
      timeZoneName: 'shortOffset',
    }).formatToParts(dt)
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    if (tzPart === 'GMT') return 0
    const match = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    if (!match) return DEFAULT_TIMEZONE
    const sign    = match[1] === '+' ? 1 : -1
    const hours   = parseInt(match[2], 10)
    const minutes = parseInt(match[3] || '0', 10)
    return sign * (hours + minutes / 60)
  } catch {
    return DEFAULT_TIMEZONE
  }
}

export function parseTime(birthTime) {
  if (!birthTime) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE }
  const [h, m] = birthTime.split(':').map(Number)
  return { hour: isNaN(h) ? DEFAULT_HOUR : h, minute: isNaN(m) ? 0 : m }
}

/** Run a Celestine chart calculation for any date/time/tz */
export function chartAt(birthdate, hour, minute = 0, tz = DEFAULT_TIMEZONE) {
  const [year, month, day] = birthdate.split('-').map(Number)
  return calculateChart({
    year, month, day, hour, minute, second: 0,
    timezone: tz, latitude: DEFAULT_LAT, longitude: DEFAULT_LON,
  })
}

function fmtHour(h, tzLabel = 'EST') {
  const period = h < 12 ? 'AM' : 'PM'
  return `~${h % 12 || 12}:00 ${period} ${tzLabel}`
}

function findIngressHour(birthdate, planetIndex, signAtStart, tz = DEFAULT_TIMEZONE) {
  let lo = 0, hi = 23
  while (hi - lo > 1) {
    const mid  = Math.floor((lo + hi) / 2)
    const sign = chartAt(birthdate, mid, 0, tz).planets[planetIndex]?.signName
    if (sign === signAtStart) lo = mid; else hi = mid
  }
  return hi
}

// ── Natal calculation functions ──────────────────────────────────────────────

export function calcMoon(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const moon  = chart.planets[1]
    if (!moon?.signName) return { moonSign: 'Unknown', moonSymbol: '☽' }
    return {
      moonSign:   moon.signName,
      moonSymbol: SIGN_SYMBOLS[moon.signName] ?? '☽',
      moonDegree: moon.degree ?? null,
    }
  } catch {
    return { moonSign: 'Unknown', moonSymbol: '☽' }
  }
}

export function calcInnerPlanets(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const get   = (idx, fallback) => {
      const p    = chart.planets[idx]
      const sign = p?.signName
      return { sign: sign ?? null, symbol: SIGN_SYMBOLS[sign] ?? fallback, degree: p?.degree ?? null }
    }
    return {
      mercury:   get(2, '☿'),
      venus:     get(3, '♀'),
      mars:      get(4, '♂'),
      sunDegree: chart.planets[0]?.degree ?? null,
    }
  } catch {
    return {
      mercury: { sign: null, symbol: '☿' },
      venus:   { sign: null, symbol: '♀' },
      mars:    { sign: null, symbol: '♂' },
    }
  }
}

export function calcOuterPlanets(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const get   = (idx, fallback) => {
      const p    = chart.planets[idx]
      const sign = p?.signName
      return { sign: sign ?? null, symbol: SIGN_SYMBOLS[sign] ?? fallback, degree: p?.degree ?? null }
    }
    return { jupiter: get(5, '♃'), saturn: get(6, '♄') }
  } catch {
    return {
      jupiter: { sign: null, symbol: '♃' },
      saturn:  { sign: null, symbol: '♄' },
    }
  }
}

export function calcSunAtTime(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  if (!birthdate || !birthTime) return null
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const sun   = chart.planets[0]
    const sign  = sun?.signName
    if (!sign) return null
    return { sign, symbol: SIGN_SYMBOLS[sign] ?? '☀', degree: sun?.degree ?? null }
  } catch {
    return null
  }
}

export function calcIngressWarnings(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  if (!birthdate || birthTime) return []
  try {
    const start    = chartAt(birthdate, 0, 0, tz)
    const end      = chartAt(birthdate, 23, 0, tz)
    const warnings = []
    const tzLabel  = tz === DEFAULT_TIMEZONE ? 'EST' : `UTC${tz >= 0 ? '+' : ''}${tz}`
    for (const { name, glyph, planet, index } of INGRESS_PLANETS) {
      const signStart = start.planets[index]?.signName
      const signEnd   = end.planets[index]?.signName
      if (signStart && signEnd && signStart !== signEnd) {
        const ingressHour = findIngressHour(birthdate, index, signStart, tz)
        warnings.push({ name, glyph, planet, signStart, signEnd, ingressTime: fmtHour(ingressHour, tzLabel), ingressHour })
      }
    }
    return warnings
  } catch {
    return []
  }
}

export function calcTimezoneWarnings(birthdate, birthTime, birthTimezone) {
  if (!birthdate) return []
  try {
    const { hour, minute } = parseTime(birthTime)
    const chartWest  = chartAt(birthdate, hour, minute, -12)
    const chartEast  = chartAt(birthdate, hour, minute, 14)
    const warnings   = []
    for (const { name, glyph, planet, index } of TZ_SENSITIVE_PLANETS) {
      const signWest = chartWest.planets[index]?.signName
      const signEast = chartEast.planets[index]?.signName
      if (signWest && signEast && signWest !== signEast) {
        warnings.push({ name, glyph, planet, signWest, signEast })
      }
    }
    return warnings
  } catch {
    return []
  }
}

/**
 * Get the full natal planet array for a person.
 * Returns raw Celestine planet objects — used by the transit engine.
 * Index: 0=Sun 1=Moon 2=Mercury 3=Venus 4=Mars 5=Jupiter 6=Saturn 7=Uranus 8=Neptune 9=Pluto
 */
export function getNatalPlanets(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    return chartAt(birthdate, hour, minute, tz).planets
  } catch {
    return []
  }
}
