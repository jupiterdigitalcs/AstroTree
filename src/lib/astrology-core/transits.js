/**
 * transits.js — Transit calculation engine
 *
 * Calculates which outer planets are currently aspecting a person's natal chart.
 * Built on top of natal.js — Celestine is never imported directly here.
 *
 * Design:
 *  - Outer planets transit natal planets (Saturn inward) — this is what matters
 *  - Curated: only the slow movers (Jupiter→Pluto) as transiting bodies
 *  - Caller controls orbs and which aspects to include
 *  - Returns applying/separating state so the UI can show momentum
 */

import { chartAt, getNatalPlanets, DEFAULT_TIMEZONE, ianaToOffset, parseTime } from './natal.js'

// ── Transit configuration ────────────────────────────────────────────────────

/** Planets that transit natal charts (slow movers only — the ones that matter) */
export const TRANSITING_BODIES = [
  { name: 'Jupiter', index: 5, glyph: '♃', avgDailyMotion: 0.083 },
  { name: 'Saturn',  index: 6, glyph: '♄', avgDailyMotion: 0.033 },
  { name: 'Uranus',  index: 7, glyph: '♅', avgDailyMotion: 0.012 },
  { name: 'Neptune', index: 8, glyph: '♆', avgDailyMotion: 0.006 },
  { name: 'Pluto',   index: 9, glyph: '♇', avgDailyMotion: 0.004 },
]

/** Natal points to check transits against (personal planets + social planets) */
export const NATAL_POINTS = [
  { name: 'Sun',     index: 0, glyph: '☀' },
  { name: 'Moon',    index: 1, glyph: '☽' },
  { name: 'Mercury', index: 2, glyph: '☿' },
  { name: 'Venus',   index: 3, glyph: '♀' },
  { name: 'Mars',    index: 4, glyph: '♂' },
  { name: 'Jupiter', index: 5, glyph: '♃' },
  { name: 'Saturn',  index: 6, glyph: '♄' },
]

/** Aspect definitions */
export const ASPECTS = {
  conjunction: { angle: 0,   symbol: '☌', name: 'conjunction' },
  opposition:  { angle: 180, symbol: '☍', name: 'opposition'  },
  trine:       { angle: 120, symbol: '△', name: 'trine'       },
  square:      { angle: 90,  symbol: '□', name: 'square'      },
  sextile:     { angle: 60,  symbol: '⚹', name: 'sextile'    },
}

/** Default orbs — Christina will tune these */
export const DEFAULT_TRANSIT_ORBS = {
  conjunction: 8,
  opposition:  8,
  trine:       6,
  square:      6,
  sextile:     4,
  quincunx:    3,
}

// ── Core math ────────────────────────────────────────────────────────────────

/** Shortest arc between two ecliptic longitudes (0–180) */
function angularSeparation(a, b) {
  const diff = Math.abs(a - b) % 360
  return diff > 180 ? 360 - diff : diff
}

/** Signed separation: positive = transiting planet is ahead of the aspect point */
function signedDeviation(transitLon, natalLon, aspectAngle) {
  let diff = (transitLon - natalLon + 360) % 360
  if (diff > 180) diff -= 360
  return diff - aspectAngle
}

/**
 * Check if a transiting planet is applying to or separating from an aspect.
 * Applying = getting closer to exact. Separating = moving away.
 * Uses the planet's longitudeSpeed from Celestine.
 */
function getPhase(transitPlanet, natalLon, aspectAngle) {
  const deviation = signedDeviation(transitPlanet.longitude, natalLon, aspectAngle)
  const speed     = transitPlanet.longitudeSpeed ?? 0
  // If deviation and speed have opposite signs, the planet is moving toward exact → applying
  const applying  = (deviation > 0 && speed < 0) || (deviation < 0 && speed > 0)
  return applying ? 'applying' : 'separating'
}

// ── Main transit calculation ─────────────────────────────────────────────────

/**
 * Calculate active transits for a single person.
 *
 * @param {object} params
 * @param {string} params.birthdate       — 'YYYY-MM-DD'
 * @param {string} [params.birthTime]     — 'HH:MM' (optional)
 * @param {string} [params.birthTimezone] — IANA timezone string (optional)
 * @param {Date}   [params.date]          — date to calculate transits for (default: today)
 * @param {object} [params.orbs]          — override default orbs
 * @param {string[]} [params.aspects]     — which aspects to include (default: all)
 * @returns {Transit[]}
 */
export function calcTransitsForPerson({
  birthdate,
  birthTime     = null,
  birthTimezone = null,
  hasBirthTime  = !!birthTime,
  date          = new Date(),
  orbs          = DEFAULT_TRANSIT_ORBS,
  aspects       = Object.keys(ASPECTS),
}) {
  const tz          = birthTimezone ? ianaToOffset(birthTimezone, birthdate) : DEFAULT_TIMEZONE
  const natalPlanets = getNatalPlanets(birthdate, birthTime, tz)
  if (!natalPlanets.length) return []

  // Get today's sky
  const todayStr       = date.toISOString().split('T')[0]
  const todayChart     = chartAt(todayStr, 12, 0, 0) // UTC noon for transit positions
  const transitPlanets = todayChart.planets

  // Without birth time, Moon can be up to 6.6° off — skip it as a transit target
  const natalTargets = hasBirthTime
    ? NATAL_POINTS
    : NATAL_POINTS.filter(p => p.name !== 'Moon')

  const activeTransits = []

  for (const transiting of TRANSITING_BODIES) {
    const tPlanet = transitPlanets[transiting.index]
    if (!tPlanet) continue

    for (const natal of natalTargets) {
      const nPlanet = natalPlanets[natal.index]
      if (!nPlanet) continue

      for (const aspectName of aspects) {
        const aspectDef = ASPECTS[aspectName]
        if (!aspectDef) continue

        const orb = orbs[aspectName] ?? DEFAULT_TRANSIT_ORBS[aspectName] ?? 5
        const sep = angularSeparation(tPlanet.longitude, nPlanet.longitude)
        const deviation = Math.abs(sep - aspectDef.angle)

        if (deviation <= orb) {
          const phase = getPhase(tPlanet, nPlanet.longitude, aspectDef.angle)
          activeTransits.push({
            // Transiting planet
            transitingPlanet:      transiting.name,
            transitingGlyph:       transiting.glyph,
            transitingSign:        tPlanet.signName,
            transitingLongitude:   tPlanet.longitude,
            transitingRetrograde:  tPlanet.isRetrograde ?? false,
            // Natal planet
            natalPlanet:           natal.name,
            natalGlyph:            natal.glyph,
            natalSign:             nPlanet.signName,
            natalLongitude:        nPlanet.longitude,
            // Aspect
            aspect:                aspectName,
            aspectSymbol:          aspectDef.symbol,
            orb:                   Math.round(deviation * 100) / 100,
            phase,                 // 'applying' | 'separating'
            exact:                 deviation < 0.5,
          })
        }
      }
    }
  }

  // Sort: tightest orb first, then by planet weight (Pluto > Neptune > Uranus > Saturn > Jupiter)
  const planetWeight = { Pluto: 5, Neptune: 4, Uranus: 3, Saturn: 2, Jupiter: 1 }
  return activeTransits.sort((a, b) => {
    const orbDiff = a.orb - b.orb
    if (Math.abs(orbDiff) > 1) return orbDiff
    return (planetWeight[b.transitingPlanet] ?? 0) - (planetWeight[a.transitingPlanet] ?? 0)
  })
}

/**
 * Calculate transits for multiple people at once (group/family view).
 * Returns a map of { memberId: Transit[] }
 *
 * @param {Array<{ id, birthdate, birthTime?, birthTimezone? }>} members
 * @param {Date}   [date]
 * @param {object} [options]
 * @returns {Record<string, Transit[]>}
 */
export function calcGroupTransits(members, date = new Date(), options = {}) {
  const results = {}
  for (const member of members) {
    if (!member.birthdate || !member.id) continue
    results[member.id] = calcTransitsForPerson({
      birthdate:     member.birthdate,
      birthTime:     member.birthTime ?? null,
      birthTimezone: member.birthTimezone ?? null,
      date,
      ...options,
    })
  }
  return results
}

/**
 * Find transits shared across multiple people — the "group themes" feature.
 * Returns transits where the same outer planet + aspect appears for 2+ people.
 *
 * @param {Record<string, Transit[]>} groupTransits — output of calcGroupTransits
 * @returns {Array<{ transitingPlanet, aspect, members: string[] }>}
 */
export function findSharedTransits(groupTransits) {
  const counts = {}
  for (const [memberId, transits] of Object.entries(groupTransits)) {
    for (const t of transits) {
      const key = `${t.transitingPlanet}:${t.aspect}:${t.natalPlanet}`
      if (!counts[key]) counts[key] = { ...t, members: [] }
      counts[key].members.push(memberId)
    }
  }
  return Object.values(counts)
    .filter(t => t.members.length >= 2)
    .sort((a, b) => b.members.length - a.members.length)
}
