import { NextResponse } from 'next/server'
import { calculateChart } from 'celestine'

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_HOUR     = 12
const DEFAULT_MINUTE   = 0
const DEFAULT_TIMEZONE = -5
const DEFAULT_LAT      = 40.7128
const DEFAULT_LON      = -74.0060

const SIGN_SYMBOLS = {
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
  { name: 'Jupiter', glyph: '♃', planet: 'jupiter', index: 5 },
  { name: 'Saturn',  glyph: '♄', planet: 'saturn',  index: 6 },
]

// Planets worth checking for timezone sensitivity (fast-moving)
// All inner planets + sun — any of these can change sign near a cusp with a timezone shift
const TZ_SENSITIVE_PLANETS = [
  { name: 'Moon',    glyph: '☽', planet: 'moon',    index: 1 },
  { name: 'Sun',     glyph: '☀', planet: 'sun',     index: 0 },
  { name: 'Mercury', glyph: '☿', planet: 'mercury', index: 2 },
  { name: 'Venus',   glyph: '♀', planet: 'venus',   index: 3 },
  { name: 'Mars',    glyph: '♂', planet: 'mars',    index: 4 },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Convert IANA timezone string to numeric UTC offset for a specific date (handles DST) */
function ianaToOffset(ianaTz, birthdate) {
  if (!ianaTz || typeof ianaTz !== 'string') return DEFAULT_TIMEZONE
  try {
    const [year, month, day] = birthdate.split('-').map(Number)
    // Create a date at noon on the birth date
    const dt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    // Format with the target timezone to extract the offset
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTz,
      timeZoneName: 'shortOffset',
    }).formatToParts(dt)
    const tzPart = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
    // tzPart is like "GMT", "GMT+5:30", "GMT-5", "GMT+10"
    if (tzPart === 'GMT') return 0
    const match = tzPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
    if (!match) return DEFAULT_TIMEZONE
    const sign = match[1] === '+' ? 1 : -1
    const hours = parseInt(match[2], 10)
    const minutes = parseInt(match[3] || '0', 10)
    return sign * (hours + minutes / 60)
  } catch {
    return DEFAULT_TIMEZONE
  }
}

function parseTime(birthTime) {
  if (!birthTime) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE }
  const [h, m] = birthTime.split(':').map(Number)
  return { hour: isNaN(h) ? DEFAULT_HOUR : h, minute: isNaN(m) ? 0 : m }
}

function chartAt(birthdate, hour, minute = 0, tz = DEFAULT_TIMEZONE) {
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
    const mid = Math.floor((lo + hi) / 2)
    const sign = chartAt(birthdate, mid, 0, tz).planets[planetIndex]?.signName
    if (sign === signAtStart) lo = mid; else hi = mid
  }
  return hi
}

// ── Calculation functions ───────────────────────────────────────────────────

function calcMoon(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const moon = chart.planets[1]
    if (!moon?.signName) return { moonSign: 'Unknown', moonSymbol: '☽' }
    return { moonSign: moon.signName, moonSymbol: SIGN_SYMBOLS[moon.signName] ?? '☽', moonDegree: moon.degree ?? null }
  } catch {
    return { moonSign: 'Unknown', moonSymbol: '☽' }
  }
}

function calcInnerPlanets(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const get = (idx, fallback) => {
      const p = chart.planets[idx]
      const sign = p?.signName
      return { sign: sign ?? null, symbol: SIGN_SYMBOLS[sign] ?? fallback, degree: p?.degree ?? null }
    }
    return { mercury: get(2, '☿'), venus: get(3, '♀'), mars: get(4, '♂'), sunDegree: chart.planets[0]?.degree ?? null }
  } catch {
    return {
      mercury: { sign: null, symbol: '☿' },
      venus:   { sign: null, symbol: '♀' },
      mars:    { sign: null, symbol: '♂' },
    }
  }
}

function calcOuterPlanets(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const get = (idx, fallback) => {
      const p = chart.planets[idx]
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

function calcSunAtTime(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  if (!birthdate || !birthTime) return null
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute, tz)
    const sun = chart.planets[0]
    const sign = sun?.signName
    if (!sign) return null
    return { sign, symbol: SIGN_SYMBOLS[sign] ?? '☀', degree: sun?.degree ?? null }
  } catch {
    return null
  }
}

function calcIngressWarnings(birthdate, birthTime, tz = DEFAULT_TIMEZONE) {
  if (!birthdate || birthTime) return []
  try {
    const start = chartAt(birthdate, 0, 0, tz)
    const end   = chartAt(birthdate, 23, 0, tz)
    const warnings = []
    // Derive a short timezone label from the offset
    const tzLabel = tz === DEFAULT_TIMEZONE ? 'EST' : `UTC${tz >= 0 ? '+' : ''}${tz}`
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

/**
 * Detect timezone sensitivity — check if any planet's sign would differ
 * across world timezones for this birthdate. Warns whenever a placement
 * is timezone-sensitive so the user knows to verify their timezone.
 */
function calcTimezoneWarnings(birthdate, birthTime, birthTimezone) {
  if (!birthdate) return []
  try {
    const { hour, minute } = parseTime(birthTime)
    // Check at the two extreme world timezone offsets
    const chartWest = chartAt(birthdate, hour, minute, -12)
    const chartEast = chartAt(birthdate, hour, minute, 14)
    const warnings = []
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

// ── Rate limiting ────────────────────────────────────────────────────────────
// In-memory per-IP limiter. Resets on cold starts but stops warm-instance abuse.
// Hard batch cap ensures a single request can never be a DDoS vector regardless.

const BATCH_LIMIT = 100         // max members per batch request
const RATE_LIMIT  = 60          // max requests per IP per window
const RATE_WINDOW = 60_000      // 1 minute in ms

const _rateMap = new Map()

function isRateLimited(ip) {
  const now = Date.now()
  const entry = _rateMap.get(ip)
  if (!entry || now - entry.start > RATE_WINDOW) {
    _rateMap.set(ip, { start: now, count: 1 })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

// ── Route handler ────────────────────────────────────────────────────────────

const CALCULATORS = {
  moon: calcMoon,
  innerPlanets: calcInnerPlanets,
  outerPlanets: calcOuterPlanets,
  sunAtTime: calcSunAtTime,
  ingressWarnings: calcIngressWarnings,
  timezoneWarnings: calcTimezoneWarnings,
}

/**
 * POST /api/astrology
 *
 * Single member:
 *   { birthdate, birthTime?, birthTimezone?, calculations: ['moon', 'innerPlanets', 'ingressWarnings'] }
 *
 * Batch:
 *   { members: [{ id, birthdate, birthTime?, birthTimezone? }], calculations: ['moon', ...] }
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()

    // Batch mode
    if (Array.isArray(body.members)) {
      if (body.members.length > BATCH_LIMIT) {
        return NextResponse.json({ error: `Batch size exceeds limit of ${BATCH_LIMIT}` }, { status: 400 })
      }
      const calcs = body.calculations ?? ['moon']
      const results = {}
      for (const member of body.members) {
        if (!member.birthdate || !member.id) continue
        const tz = member.birthTimezone ? ianaToOffset(member.birthTimezone, member.birthdate) : DEFAULT_TIMEZONE
        const data = {}
        for (const calc of calcs) {
          const fn = CALCULATORS[calc]
          if (!fn) continue
          if (calc === 'timezoneWarnings') {
            data[calc] = fn(member.birthdate, member.birthTime ?? null, member.birthTimezone ?? null)
          } else {
            data[calc] = fn(member.birthdate, member.birthTime ?? null, tz)
          }
        }
        results[member.id] = data
      }
      return NextResponse.json(results)
    }

    // Single mode
    if (!body.birthdate) return NextResponse.json({ error: 'Missing birthdate' }, { status: 400 })
    const tz = body.birthTimezone ? ianaToOffset(body.birthTimezone, body.birthdate) : DEFAULT_TIMEZONE
    const calcs = body.calculations ?? ['moon']
    const data = {}
    for (const calc of calcs) {
      const fn = CALCULATORS[calc]
      if (!fn) continue
      if (calc === 'timezoneWarnings') {
        data[calc] = fn(body.birthdate, body.birthTime ?? null, body.birthTimezone ?? null)
      } else {
        data[calc] = fn(body.birthdate, body.birthTime ?? null, tz)
      }
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
