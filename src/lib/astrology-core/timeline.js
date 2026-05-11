/**
 * timeline.js — Transit timeline calculation engine
 *
 * Finds all significant transit events for a person over their lifetime.
 * Unlike calcTransitsForPerson (snapshot of today), this scans a date range
 * and returns discrete chapter events sorted chronologically.
 *
 * Algorithm:
 *   1. Coarse 12-day scan → detect local minima in transit deviation
 *   2. Ternary search → refine each minimum to the exact peak date
 *   3. Binary search → find orb entry/exit dates per chapter
 *   4. Merge retrograde passes (2–3 hits within 12 months = one chapter)
 */

import { chartAt, getNatalPlanets, ianaToOffset, DEFAULT_TIMEZONE } from './natal.js'
import { angularSeparation } from './aspects.js'
import { TRANSITING_BODIES, NATAL_POINTS, ASPECTS } from './transits.js'

// ── Curated transit pairs ────────────────────────────────────────────────────

/**
 * Which (transiting planet, natal point, aspects) combinations to scan.
 * moonOnly: true → pair is skipped when the person has no birth time (Moon position unreliable).
 *
 * tIdx / nIdx match Celestine planet array:
 *   0=Sun 1=Moon 2=Mercury 3=Venus 4=Mars 5=Jupiter 6=Saturn 7=Uranus 8=Neptune 9=Pluto
 */
const CURATED_TRANSIT_PAIRS = [
  // Jupiter — expansion windows + 12-yr return
  { t: 'Jupiter', tIdx: 5, n: 'Sun',     nIdx: 0, aspects: ['conjunction', 'opposition'] },
  { t: 'Jupiter', tIdx: 5, n: 'Moon',    nIdx: 1, aspects: ['conjunction'],               moonOnly: true },
  { t: 'Jupiter', tIdx: 5, n: 'Jupiter', nIdx: 5, aspects: ['conjunction'] },              // Jupiter Return
  // Saturn — structure, tests, 29-yr return
  { t: 'Saturn',  tIdx: 6, n: 'Sun',     nIdx: 0, aspects: ['conjunction', 'square', 'opposition'] },
  { t: 'Saturn',  tIdx: 6, n: 'Moon',    nIdx: 1, aspects: ['conjunction', 'square'],     moonOnly: true },
  { t: 'Saturn',  tIdx: 6, n: 'Venus',   nIdx: 3, aspects: ['conjunction'] },
  { t: 'Saturn',  tIdx: 6, n: 'Saturn',  nIdx: 6, aspects: ['conjunction'] },              // Saturn Return
  // Uranus — disruption, once or twice per lifetime
  { t: 'Uranus',  tIdx: 7, n: 'Sun',     nIdx: 0, aspects: ['conjunction', 'square', 'opposition'] },
  { t: 'Uranus',  tIdx: 7, n: 'Moon',    nIdx: 1, aspects: ['conjunction', 'square', 'opposition'], moonOnly: true },
  { t: 'Uranus',  tIdx: 7, n: 'Venus',   nIdx: 3, aspects: ['conjunction'] },
  // Neptune — dissolution, identity fog
  { t: 'Neptune', tIdx: 8, n: 'Sun',     nIdx: 0, aspects: ['conjunction', 'square'] },
  { t: 'Neptune', tIdx: 8, n: 'Moon',    nIdx: 1, aspects: ['square'],                    moonOnly: true },
  { t: 'Neptune', tIdx: 8, n: 'Venus',   nIdx: 3, aspects: ['conjunction'] },
  // Pluto — transformation, power
  { t: 'Pluto',   tIdx: 9, n: 'Sun',     nIdx: 0, aspects: ['conjunction', 'square', 'opposition'] },
  { t: 'Pluto',   tIdx: 9, n: 'Moon',    nIdx: 1, aspects: ['conjunction', 'square'],     moonOnly: true },
  { t: 'Pluto',   tIdx: 9, n: 'Venus',   nIdx: 3, aspects: ['conjunction'] },
]

// ── Constants ────────────────────────────────────────────────────────────────

const SCAN_STEP_DAYS = 12    // coarse scan interval — safely catches Jupiter at max speed
const PEAK_ORB       = 2     // must reach within 2° to register as a chapter
const FULL_ORB       = 8     // orb used for chapter start/end dates
const MS_PER_DAY     = 86_400_000

// ── Low-level helpers ────────────────────────────────────────────────────────

function dateStr(date) {
  return date.toISOString().split('T')[0]
}

function stepDate(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

/**
 * Angular deviation of a transiting planet from an aspect point on a given date.
 * Returns 360 on error (safely excludes the date from transit detection).
 */
function getDeviation(natalLon, aspectAngle, transitIdx, date) {
  try {
    const chart   = chartAt(dateStr(date), 12, 0, 0)
    const tPlanet = chart.planets[transitIdx]
    if (!tPlanet?.longitude) return 360
    return Math.abs(angularSeparation(tPlanet.longitude, natalLon) - aspectAngle)
  } catch {
    return 360
  }
}

/**
 * Ternary search for the closest approach (minimum deviation) between lo and hi.
 * 20 iterations gives day-level precision within any 30-day window.
 */
function refinePeak(natalLon, aspectAngle, transitIdx, lo, hi) {
  let loMs = lo.getTime()
  let hiMs = hi.getTime()
  for (let i = 0; i < 20; i++) {
    const m1 = new Date(loMs + (hiMs - loMs) / 3)
    const m2 = new Date(loMs + 2 * (hiMs - loMs) / 3)
    if (getDeviation(natalLon, aspectAngle, transitIdx, m1) <
        getDeviation(natalLon, aspectAngle, transitIdx, m2)) {
      hiMs = m2.getTime()
    } else {
      loMs = m1.getTime()
    }
  }
  return new Date((loMs + hiMs) / 2)
}

/**
 * Binary search for the edge of an orb window.
 * direction: 1 = forward in time, -1 = backward from peakDate.
 * Uses a 3-year bound — covers all outer planet transit durations.
 * 12 iterations gives ~week-level precision.
 */
function findOrbEdge(natalLon, aspectAngle, transitIdx, peakDate, direction, maxOrb) {
  let a = peakDate.getTime()                                       // known in-orb point
  let b = peakDate.getTime() + direction * 3 * 365 * MS_PER_DAY  // 3-year bound (out of orb)
  for (let i = 0; i < 12; i++) {
    const mid = new Date((a + b) / 2)
    if (getDeviation(natalLon, aspectAngle, transitIdx, mid) < maxOrb) {
      a = mid.getTime()  // still in orb — push in-orb bound outward
    } else {
      b = mid.getTime()  // out of orb — push out-orb bound inward
    }
  }
  return new Date((a + b) / 2)
}

/**
 * Merge consecutive retrograde passes of the same transit into one chapter.
 * A planet in retrograde can cross the same natal degree 2–3 times within ~12 months.
 * Those passes belong to the same life chapter.
 */
function mergeRetrogradePasses(events) {
  if (!events.length) return []

  // Outer planets (Saturn–Pluto) can retrograde across the same natal point
  // over 2–3 passes spanning up to ~18 months — treat them as one chapter.
  const TWELVE_MONTHS = 18 * 30 * MS_PER_DAY
  const sorted = [...events].sort((a, b) => {
    const ka = `${a.transitingPlanet}|${a.natalPlanet}|${a.aspect}`
    const kb = `${b.transitingPlanet}|${b.natalPlanet}|${b.aspect}`
    return ka !== kb ? ka.localeCompare(kb) : a.peakDate.getTime() - b.peakDate.getTime()
  })

  const merged = []
  for (const ev of sorted) {
    const key     = `${ev.transitingPlanet}|${ev.natalPlanet}|${ev.aspect}`
    const last    = merged[merged.length - 1]
    const lastKey = last ? `${last.transitingPlanet}|${last.natalPlanet}|${last.aspect}` : null

    if (lastKey === key &&
        ev.peakDate.getTime() - last.lastPeakDate.getTime() < TWELVE_MONTHS) {
      // Extend existing chapter to cover this retrograde pass
      last.lastPeakDate = ev.peakDate
      last.orbEnd       = ev.orbEnd
      last.passes++
    } else {
      merged.push({ ...ev, firstPeakDate: ev.peakDate, lastPeakDate: ev.peakDate, passes: 1 })
    }
  }

  return merged.sort((a, b) => a.firstPeakDate.getTime() - b.firstPeakDate.getTime())
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Calculate all significant transit chapters for a person over a date range.
 * Returns events sorted chronologically from startDate to endDate.
 *
 * Cost: ~3,000–4,000 Celestine calls (coarse scan + refinement + orb edges).
 * Should be cached by the caller — this is a one-time compute per person.
 *
 * @param {object} params
 * @param {string}  params.birthdate       — 'YYYY-MM-DD'
 * @param {string}  [params.birthTime]     — 'HH:MM' (optional — gates Moon chapters)
 * @param {string}  [params.birthTimezone] — IANA timezone string (optional)
 * @param {Date}    params.startDate       — scan start (typically person's birthdate as Date)
 * @param {Date}    params.endDate         — scan end (typically birthdate + 85 years)
 * @returns {TransitChapter[]}
 */
export function calcTransitTimeline({
  birthdate,
  birthTime     = null,
  birthTimezone = null,
  startDate,
  endDate,
}) {
  const tz           = birthTimezone ? ianaToOffset(birthTimezone, birthdate) : DEFAULT_TIMEZONE
  const hasBirthTime = !!birthTime
  const natalPlanets = getNatalPlanets(birthdate, birthTime, tz)
  if (!natalPlanets.length) return []

  const activePairs = CURATED_TRANSIT_PAIRS.filter(p => !p.moonOnly || hasBirthTime)

  // ── Coarse scan ─────────────────────────────────────────────────────────────
  // One chartAt call per step reads all 5 transiting planets simultaneously.
  const series = []
  for (let d = new Date(startDate.getTime()); d <= endDate; d = stepDate(d, SCAN_STEP_DAYS)) {
    try {
      const chart = chartAt(dateStr(d), 12, 0, 0)
      series.push({ date: new Date(d), planets: chart.planets })
    } catch { /* skip dates Celestine can't handle */ }
  }
  if (series.length < 3) return []

  // ── Detect and refine each transit peak ─────────────────────────────────────
  const rawEvents = []

  for (const pair of activePairs) {
    const nPlanet = natalPlanets[pair.nIdx]
    if (!nPlanet?.longitude) continue

    for (const aspectName of pair.aspects) {
      const aspectAngle = ASPECTS[aspectName]?.angle
      if (aspectAngle === undefined) continue

      // Build deviation series for this pair
      const devs = series.map(s => {
        const tp = s.planets[pair.tIdx]
        return {
          date: s.date,
          dev:  tp?.longitude
            ? Math.abs(angularSeparation(tp.longitude, nPlanet.longitude) - aspectAngle)
            : 360,
        }
      })

      // Find local minima below PEAK_ORB (each one = a transit chapter)
      for (let i = 1; i < devs.length - 1; i++) {
        if (devs[i].dev >= PEAK_ORB) continue
        // Strict local minimum: must be less than both neighbors
        if (devs[i].dev >= devs[i - 1].dev || devs[i].dev >= devs[i + 1].dev) continue

        // Refine peak and find orb window
        const lo       = devs[i - 1].date
        const hi       = devs[i + 1].date
        const peak     = refinePeak(nPlanet.longitude, aspectAngle, pair.tIdx, lo, hi)
        const orbStart = findOrbEdge(nPlanet.longitude, aspectAngle, pair.tIdx, peak, -1, FULL_ORB)
        const orbEnd   = findOrbEdge(nPlanet.longitude, aspectAngle, pair.tIdx, peak,  1, FULL_ORB)

        const tBody  = TRANSITING_BODIES.find(b => b.name === pair.t)
        const nPoint = NATAL_POINTS.find(p => p.name === pair.n)

        rawEvents.push({
          transitingPlanet: pair.t,
          transitingGlyph:  tBody?.glyph  ?? '',
          natalPlanet:      pair.n,
          natalGlyph:       nPoint?.glyph ?? '',
          aspect:           aspectName,
          aspectSymbol:     ASPECTS[aspectName].symbol,
          peakDate:         peak,
          orbStart,
          orbEnd,
        })
      }
    }
  }

  // Drop events peaking within the first 2 years of life.
  // Those are natal-position artifacts (the planet hasn't moved far enough
  // to be a true transit chapter) — not meaningful life experiences.
  const twoYearsMs = 2 * 365.25 * MS_PER_DAY
  const minPeakDate = new Date(startDate.getTime() + twoYearsMs)

  return mergeRetrogradePasses(rawEvents).filter(ev => ev.firstPeakDate >= minPeakDate)
}
