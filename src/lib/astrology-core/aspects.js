/**
 * aspects.js — Aspect detection and natal aspect calculation
 *
 * Christina's specs:
 *  - 5 major aspects only (no quincunx, no minors)
 *  - Orbs: conjunction 6°, opposition 4° (must be in sign), trine/square 4°, sextile 3°
 *  - No outer-to-outer aspects (Uranus/Neptune/Pluto vs each other — generational, not personal)
 *  - Birth time uncertainty is tracked per aspect so the UI can flag uncertain ones
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const PLANET_GLYPHS = {
  Sun: '☀', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
}

/**
 * Max positional error (degrees) when birth time is unknown.
 * Based on average daily motion × 0.5 (half-day of uncertainty).
 */
const BIRTH_TIME_UNCERTAINTY = {
  Sun:     0.5,
  Moon:    6.6,
  Mercury: 0.75,
  Venus:   0.6,
  Mars:    0.25,
  Jupiter: 0.04,
  Saturn:  0.015,
  Uranus:  0.005,
  Neptune: 0.003,
  Pluto:   0.002,
}

/** Average daily motion — used to determine which planet is faster (applying) */
const DAILY_MOTION = {
  Sun:     1.0,
  Moon:    13.2,
  Mercury: 1.5,
  Venus:   1.2,
  Mars:    0.5,
  Jupiter: 0.083,
  Saturn:  0.033,
  Uranus:  0.012,
  Neptune: 0.006,
  Pluto:   0.004,
}

/**
 * The five major aspects with Christina's orbs.
 * mustBeInSign: opposition must have planets in opposing signs — not just ~180° apart.
 */
export const ASPECT_DEFINITIONS = {
  conjunction: { angle: 0,   orb: 6, symbol: '☌', mustBeInSign: true  },
  opposition:  { angle: 180, orb: 4, symbol: '☍', mustBeInSign: false },
  trine:       { angle: 120, orb: 4, symbol: '△', mustBeInSign: false },
  square:      { angle: 90,  orb: 4, symbol: '□', mustBeInSign: false },
  sextile:     { angle: 60,  orb: 3, symbol: '⚹', mustBeInSign: false },
}

/** The only planets we care about — filters out Celestine's asteroids (Chiron, Pallas, etc.) */
const TRADITIONAL_PLANETS = new Set([
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
  'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
])

/** Outer planets — aspects between any two of these are skipped (generational, not personal) */
const OUTER_PLANETS = new Set(['Uranus', 'Neptune', 'Pluto'])

// ── Math helpers ─────────────────────────────────────────────────────────────

/** Shortest arc between two ecliptic longitudes → 0–180° */
export function angularSeparation(lonA, lonB) {
  const diff = Math.abs(lonA - lonB) % 360
  return diff > 180 ? 360 - diff : diff
}

/** Celestine sign index from ecliptic longitude (0=Aries … 11=Pisces) */
function signIdx(longitude) {
  return Math.floor(((longitude % 360) + 360) % 360 / 30)
}

/** True if two longitudes are in the same sign */
function sameSign(lonA, lonB) {
  return signIdx(lonA) === signIdx(lonB)
}

// ── Confidence calculation ───────────────────────────────────────────────────

/**
 * How reliable is this aspect given whether we have an exact birth time?
 *
 * 'confirmed' — birth time given, or both planets are slow enough that the
 *               positional uncertainty is negligible (<0.1° combined)
 * 'likely'    — small uncertainty, aspect is almost certainly within orb
 *               even accounting for the birth-time error
 * 'uncertain' — Moon or Mercury involved without birth time; the planet
 *               could be far enough off to invalidate the aspect
 */
function calcConfidence(orb, aspectOrb, p1Name, p2Name, hasBirthTime) {
  if (hasBirthTime) return 'confirmed'

  const u1 = BIRTH_TIME_UNCERTAINTY[p1Name] ?? 0
  const u2 = BIRTH_TIME_UNCERTAINTY[p2Name] ?? 0
  const totalUncertainty = u1 + u2

  // Both slow planets — positional error is negligible
  if (totalUncertainty < 0.1) return 'confirmed'

  // If worst-case position pushes the orb past the limit, flag as uncertain
  if (orb + totalUncertainty > aspectOrb) return 'uncertain'

  // Moon or Mercury as primary contributor — flag even if mathematically within orb
  if (u1 > 0.5 || u2 > 0.5) return 'uncertain'

  return 'likely'
}

// ── Core aspect detection ────────────────────────────────────────────────────

/**
 * Detect whether two planets form a major aspect.
 * Returns the aspect data or null if no aspect within orb.
 *
 * @param {{ name, longitude, signName, sign }} planet1
 * @param {{ name, longitude, signName, sign }} planet2
 * @param {boolean} hasBirthTime
 * @returns {AspectResult | null}
 */
export function detectAspect(planet1, planet2, hasBirthTime = true) {
  const sep = angularSeparation(planet1.longitude, planet2.longitude)

  for (const [aspectName, def] of Object.entries(ASPECT_DEFINITIONS)) {
    const deviation = Math.abs(sep - def.angle)
    if (deviation > def.orb) continue

    // Conjunction: both planets must be in the same sign (out-of-sign conjunctions don't count)
    if (def.mustBeInSign && !sameSign(planet1.longitude, planet2.longitude)) continue

    // The faster planet is the "applying" one in a natal chart context
    const speed1 = DAILY_MOTION[planet1.name] ?? 0
    const speed2 = DAILY_MOTION[planet2.name] ?? 0
    const applyingPlanet = speed1 >= speed2 ? planet1.name : planet2.name

    return {
      aspect:         aspectName,
      symbol:         def.symbol,
      orb:            Math.round(deviation * 100) / 100,
      exact:          deviation < 0.5,
      applying:       applyingPlanet,
      confidence:     calcConfidence(deviation, def.orb, planet1.name, planet2.name, hasBirthTime),
    }
  }

  return null
}

// ── Natal aspect calculation ─────────────────────────────────────────────────

/**
 * Calculate all major natal aspects for a set of planets.
 * Skips outer-to-outer (Uranus/Neptune/Pluto vs each other).
 * Sorted by tightness (orb ascending).
 *
 * @param {object[]} planets     — Celestine planet array from getNatalPlanets()
 * @param {boolean}  hasBirthTime
 * @returns {NatalAspect[]}
 */
export function calcNatalAspects(planets, hasBirthTime = true) {
  const aspects = []

  const filtered = planets.filter(p => TRADITIONAL_PLANETS.has(p?.name))

  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const p1 = filtered[i]
      const p2 = filtered[j]

      // Skip outer-to-outer (generational, not personal)
      if (OUTER_PLANETS.has(p1.name) && OUTER_PLANETS.has(p2.name)) continue
      if (!p1?.longitude || !p2?.longitude) continue

      const result = detectAspect(p1, p2, hasBirthTime)
      if (!result) continue

      aspects.push({
        planet1: { name: p1.name, sign: p1.signName, longitude: p1.longitude, glyph: PLANET_GLYPHS[p1.name] ?? '' },
        planet2: { name: p2.name, sign: p2.signName, longitude: p2.longitude, glyph: PLANET_GLYPHS[p2.name] ?? '' },
        ...result,
      })
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb)
}

// ── Cross-chart (synastry/hereditary) aspects ────────────────────────────────

/**
 * Find aspects between two people's natal charts.
 * Used for synastry and the hereditary patterns feature.
 *
 * @param {object[]} planetsA   — natal planets for person A
 * @param {object[]} planetsB   — natal planets for person B
 * @param {boolean}  hasBirthTimeA
 * @param {boolean}  hasBirthTimeB
 * @returns {CrossAspect[]}
 */
export function calcCrossAspects(planetsA, planetsB, hasBirthTimeA = true, hasBirthTimeB = true) {
  const aspects = []
  const hasBirthTime = hasBirthTimeA && hasBirthTimeB

  const filteredA = planetsA.filter(p => TRADITIONAL_PLANETS.has(p?.name))
  const filteredB = planetsB.filter(p => TRADITIONAL_PLANETS.has(p?.name))

  for (const pA of filteredA) {
    for (const pB of filteredB) {
      if (OUTER_PLANETS.has(pA.name) && OUTER_PLANETS.has(pB.name)) continue
      if (!pA?.longitude || !pB?.longitude) continue

      const result = detectAspect(pA, pB, hasBirthTime)
      if (!result) continue

      aspects.push({
        personA: { name: pA.name, sign: pA.signName, longitude: pA.longitude, glyph: PLANET_GLYPHS[pA.name] ?? '' },
        personB: { name: pB.name, sign: pB.signName, longitude: pB.longitude, glyph: PLANET_GLYPHS[pB.name] ?? '' },
        ...result,
      })
    }
  }

  return aspects.sort((a, b) => a.orb - b.orb)
}

// ── Group / hereditary patterns ───────────────────────────────────────────────

/**
 * Find the same natal aspect appearing across multiple family members.
 * "Three generations all have Moon-Saturn contacts" is the hereditary pattern.
 *
 * @param {Array<{ id, name, aspects: NatalAspect[] }>} memberProfiles
 * @returns {Array<{ aspect, planet1, planet2, members: string[], count: number }>}
 */
export function findHereditaryAspects(memberProfiles) {
  const counts = {}

  for (const member of memberProfiles) {
    for (const a of member.aspects) {
      // Normalize key so Venus-Mars and Mars-Venus are the same pattern
      const planets = [a.planet1.name, a.planet2.name].sort()
      const key = `${planets[0]}:${a.aspect}:${planets[1]}`
      if (!counts[key]) {
        counts[key] = {
          aspect:  a.aspect,
          symbol:  a.symbol,
          planet1: planets[0],
          planet2: planets[1],
          members: [],
        }
      }
      counts[key].members.push({ id: member.id, name: member.name, orb: a.orb })
    }
  }

  return Object.values(counts)
    .filter(p => p.members.length >= 2)
    .map(p => ({ ...p, count: p.members.length }))
    .sort((a, b) => b.count - a.count)
}
