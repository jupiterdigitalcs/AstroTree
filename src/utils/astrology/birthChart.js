import { calculateChart } from 'celestine'

// Default assumptions until birth time/location input is added (MVP 3)
const DEFAULT_HOUR     = 12  // noon
const DEFAULT_MINUTE   = 0
const DEFAULT_TIMEZONE = -5  // EST
const DEFAULT_LAT      = 40.7128  // New York
const DEFAULT_LON      = -74.0060

const SIGN_SYMBOLS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

export function getMoonSign(birthdate, birthTime = null) {
  try {
    const date = new Date(birthdate + 'T12:00:00')
    let hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE
    if (birthTime) {
      const [h, m] = birthTime.split(':').map(Number)
      if (!isNaN(h)) { hour = h; minute = isNaN(m) ? 0 : m }
    }
    const chart = calculateChart({
      year:     date.getFullYear(),
      month:    date.getMonth() + 1,
      day:      date.getDate(),
      hour, minute, second: 0,
      timezone: DEFAULT_TIMEZONE,
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LON,
    })
    // Moon is planet index 1
    const moon = chart.planets[1]
    if (!moon?.signName) return { moonSign: 'Unknown', moonSymbol: '☽' }
    return {
      moonSign:   moon.signName,
      moonSymbol: SIGN_SYMBOLS[moon.signName] ?? '☽',
    }
  } catch {
    return { moonSign: 'Unknown', moonSymbol: '☽' }
  }
}

const INGRESS_PLANETS = [
  { name: 'Sun',     glyph: '☀', planet: 'sun',     index: 0 },
  { name: 'Moon',    glyph: '☽', planet: 'moon',    index: 1 },
  { name: 'Mercury', glyph: '☿', planet: 'mercury', index: 2 },
  { name: 'Venus',   glyph: '♀', planet: 'venus',   index: 3 },
  { name: 'Mars',    glyph: '♂', planet: 'mars',    index: 4 },
]

function chartAt(birthdate, hour, minute = 0) {
  const [year, month, day] = birthdate.split('-').map(Number)
  return calculateChart({
    year, month, day,
    hour, minute, second: 0,
    timezone: DEFAULT_TIMEZONE,
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LON,
  })
}

// Binary search for the approximate hour a planet changes sign (resolution: 1 hr)
function findIngressHour(birthdate, planetIndex, signAtStart) {
  let lo = 0, hi = 23
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    const sign = chartAt(birthdate, mid).planets[planetIndex]?.signName
    if (sign === signAtStart) lo = mid
    else hi = mid
  }
  return hi
}

function fmtHour(h) {
  const period = h < 12 ? 'AM' : 'PM'
  const display = h % 12 || 12
  return `~${display}:00 ${period} EST`
}

// Returns Mercury, Venus, Mars signs — used in the tables view.
// Uses birth time when available, falls back to noon.
export function getInnerPlanetSigns(birthdate, birthTime = null) {
  try {
    let hour = DEFAULT_HOUR, minute = DEFAULT_MINUTE
    if (birthTime) {
      const [h, m] = birthTime.split(':').map(Number)
      if (!isNaN(h)) { hour = h; minute = isNaN(m) ? 0 : m }
    }
    const chart = chartAt(birthdate, hour, minute)
    const get = (idx, fallback) => {
      const sign = chart.planets[idx]?.signName
      return { sign: sign ?? null, symbol: SIGN_SYMBOLS[sign] ?? fallback }
    }
    return {
      mercury: get(2, '☿'),
      venus:   get(3, '♀'),
      mars:    get(4, '♂'),
    }
  } catch {
    return {
      mercury: { sign: null, symbol: '☿' },
      venus:   { sign: null, symbol: '♀' },
      mars:    { sign: null, symbol: '♂' },
    }
  }
}

// Returns sun sign at a specific birth time — needed when sun changes sign mid-day.
// Falls back to null if calculation fails (caller should keep existing getSunSign result).
export function getSunSignAtTime(birthdate, birthTime) {
  if (!birthdate || !birthTime) return null
  try {
    const [h, m] = birthTime.split(':').map(Number)
    const hour   = isNaN(h) ? DEFAULT_HOUR : h
    const minute = isNaN(m) ? 0 : m
    const chart  = chartAt(birthdate, hour, minute)
    const sign   = chart.planets[0]?.signName
    if (!sign) return null
    return { sign, symbol: SIGN_SYMBOLS[sign] ?? '☀' }
  } catch {
    return null
  }
}

// Returns warnings for any planet that changes sign during the birth date.
// Pass birthTime (HH:MM string) to suppress warnings — birth time resolves the ambiguity.
// Each warning: { name, glyph, planet, signStart, signEnd, ingressTime, ingressHour }
export function checkIngressWarnings(birthdate, birthTime = null) {
  if (!birthdate) return []
  if (birthTime) return []  // Birth time on file — ambiguity resolved
  try {
    const start = chartAt(birthdate, 0)
    const end   = chartAt(birthdate, 23)
    const warnings = []
    INGRESS_PLANETS.forEach(({ name, glyph, planet, index }) => {
      const signStart = start.planets[index]?.signName
      const signEnd   = end.planets[index]?.signName
      if (signStart && signEnd && signStart !== signEnd) {
        const ingressHour = findIngressHour(birthdate, index, signStart)
        warnings.push({ name, glyph, planet, signStart, signEnd, ingressTime: fmtHour(ingressHour), ingressHour })
      }
    })
    return warnings
  } catch {
    return []
  }
}
