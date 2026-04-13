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

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseTime(birthTime) {
  if (!birthTime) return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE }
  const [h, m] = birthTime.split(':').map(Number)
  return { hour: isNaN(h) ? DEFAULT_HOUR : h, minute: isNaN(m) ? 0 : m }
}

function chartAt(birthdate, hour, minute = 0) {
  const [year, month, day] = birthdate.split('-').map(Number)
  return calculateChart({
    year, month, day, hour, minute, second: 0,
    timezone: DEFAULT_TIMEZONE, latitude: DEFAULT_LAT, longitude: DEFAULT_LON,
  })
}

function fmtHour(h) {
  const period = h < 12 ? 'AM' : 'PM'
  return `~${h % 12 || 12}:00 ${period} EST`
}

function findIngressHour(birthdate, planetIndex, signAtStart) {
  let lo = 0, hi = 23
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    const sign = chartAt(birthdate, mid).planets[planetIndex]?.signName
    if (sign === signAtStart) lo = mid; else hi = mid
  }
  return hi
}

// ── Calculation functions ───────────────────────────────────────────────────

function calcMoon(birthdate, birthTime) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute)
    const moon = chart.planets[1]
    if (!moon?.signName) return { moonSign: 'Unknown', moonSymbol: '☽' }
    return { moonSign: moon.signName, moonSymbol: SIGN_SYMBOLS[moon.signName] ?? '☽', moonDegree: moon.degree ?? null }
  } catch {
    return { moonSign: 'Unknown', moonSymbol: '☽' }
  }
}

function calcInnerPlanets(birthdate, birthTime) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute)
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

function calcOuterPlanets(birthdate, birthTime) {
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute)
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

function calcSunAtTime(birthdate, birthTime) {
  if (!birthdate || !birthTime) return null
  try {
    const { hour, minute } = parseTime(birthTime)
    const chart = chartAt(birthdate, hour, minute)
    const sun = chart.planets[0]
    const sign = sun?.signName
    if (!sign) return null
    return { sign, symbol: SIGN_SYMBOLS[sign] ?? '☀', degree: sun?.degree ?? null }
  } catch {
    return null
  }
}

function calcIngressWarnings(birthdate, birthTime) {
  if (!birthdate || birthTime) return []
  try {
    const start = chartAt(birthdate, 0)
    const end   = chartAt(birthdate, 23)
    const warnings = []
    for (const { name, glyph, planet, index } of INGRESS_PLANETS) {
      const signStart = start.planets[index]?.signName
      const signEnd   = end.planets[index]?.signName
      if (signStart && signEnd && signStart !== signEnd) {
        const ingressHour = findIngressHour(birthdate, index, signStart)
        warnings.push({ name, glyph, planet, signStart, signEnd, ingressTime: fmtHour(ingressHour), ingressHour })
      }
    }
    return warnings
  } catch {
    return []
  }
}

// ── Route handler ───────────────────────────────────────────────────────────

const CALCULATORS = {
  moon: calcMoon,
  innerPlanets: calcInnerPlanets,
  outerPlanets: calcOuterPlanets,
  sunAtTime: calcSunAtTime,
  ingressWarnings: calcIngressWarnings,
}

/**
 * POST /api/astrology
 *
 * Single member:
 *   { birthdate, birthTime?, calculations: ['moon', 'innerPlanets', 'ingressWarnings'] }
 *
 * Batch:
 *   { members: [{ id, birthdate, birthTime? }], calculations: ['moon', ...] }
 */
export async function POST(request) {
  try {
    const body = await request.json()

    // Batch mode
    if (Array.isArray(body.members)) {
      const calcs = body.calculations ?? ['moon']
      const results = {}
      for (const member of body.members) {
        if (!member.birthdate || !member.id) continue
        const data = {}
        for (const calc of calcs) {
          const fn = CALCULATORS[calc]
          if (fn) data[calc] = fn(member.birthdate, member.birthTime ?? null)
        }
        results[member.id] = data
      }
      return NextResponse.json(results)
    }

    // Single mode
    if (!body.birthdate) return NextResponse.json({ error: 'Missing birthdate' }, { status: 400 })
    const calcs = body.calculations ?? ['moon']
    const data = {}
    for (const calc of calcs) {
      const fn = CALCULATORS[calc]
      if (fn) data[calc] = fn(body.birthdate, body.birthTime ?? null)
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
