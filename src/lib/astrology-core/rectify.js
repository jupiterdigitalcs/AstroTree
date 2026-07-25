/**
 * rectify.js — birth time rectification math for The Hour
 *
 * A candidate time window is divided into bins, each holding the chart
 * angles (ASC/MC) and moon position at that minute plus a probability
 * weight. Answers to narrowing questions multiply bin weights; the result
 * is the smallest contiguous window holding most of the probability mass.
 *
 * All functions here are pure so they can be unit tested; the API route
 * supplies the Celestine-backed callbacks (ascLonAt, event transits).
 *
 * NOTE on orbs: the transit-to-angle orbs below are intentionally tight
 * and belong to this module alone. They are NOT the natal/synastry orbs
 * in aspects.js (Christina's spec) — those must not be reused or changed.
 */

import { angularSeparation } from './aspects.js'
import { chartAtLocation, SIGN_SYMBOLS } from './natal.js'
import { getElement } from '../../utils/astrology/elements.js'

// ── Constants ────────────────────────────────────────────────────────────────

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

/** Transit-to-angle orbs for life-event scoring. ASC/MC move ~1° per 4
 *  minutes of birth time, so wide orbs would erase the signal. */
export const RECTIFY_ANGLE_ORBS = { conjunction: 1.5, square: 1.0, opposition: 1.5 }

/** How much weight each transiting planet carries in event scoring */
export const RECTIFY_TRANSIT_WEIGHTS = {
  Jupiter: 0.5, Saturn: 0.9, Uranus: 1.0, Neptune: 1.0, Pluto: 1.0,
}

/** One event can never multiply a bin's weight by more than this */
export const MAX_EVENT_FACTOR = 3.0

/** Answer multipliers for rising-sign fit questions */
export const RISING_FIT_FACTORS = { yes: 2.0, somewhat: 1.3, no: 0.4, skip: 1.0 }

/** Answer multipliers for the moon-boundary question */
export const MOON_FACTORS = { matched: 1.8, other: 0.55, skip: 1.0 }

// ── Small helpers ────────────────────────────────────────────────────────────

/** Sign index (0=Aries … 11=Pisces) from an ecliptic longitude */
export function signOfLon(longitude) {
  return Math.floor(((longitude % 360) + 360) % 360 / 30)
}

export function signNameOfLon(longitude) {
  return SIGN_NAMES[signOfLon(longitude)]
}

/** Minutes-past-midnight → 'HH:MM' (24h) */
export function minuteToHHMM(minute) {
  const m = Math.max(0, Math.min(1439, Math.round(minute)))
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

// ── Candidate window ─────────────────────────────────────────────────────────

const PART_OF_DAY_MINUTES = {
  night:     [0, 360],
  morning:   [360, 720],
  afternoon: [720, 1080],
  evening:   [1080, 1440],
}

/**
 * Candidate window in minutes-past-midnight from what the person knows.
 * timeKnowledge:
 *   { kind: 'exact', time: 'HH:MM', uncertaintyMinutes }
 *   { kind: 'partOfDay', part: 'night'|'morning'|'afternoon'|'evening' }
 *   { kind: 'unknown' }
 */
export function windowFromTimeKnowledge(timeKnowledge) {
  const tk = timeKnowledge ?? { kind: 'unknown' }
  if (tk.kind === 'exact' && /^\d{1,2}:\d{2}$/.test(tk.time ?? '')) {
    const [h, m] = tk.time.split(':').map(Number)
    const center = h * 60 + m
    const u = Math.max(15, Math.min(240, tk.uncertaintyMinutes ?? 60))
    return {
      startMinute: Math.max(0, center - u),
      endMinute:   Math.min(1440, center + u),
    }
  }
  if (tk.kind === 'partOfDay' && PART_OF_DAY_MINUTES[tk.part]) {
    const [start, end] = PART_OF_DAY_MINUTES[tk.part]
    return {
      startMinute: Math.max(0, start - 30),
      endMinute:   Math.min(1440, end + 30),
    }
  }
  return { startMinute: 0, endMinute: 1440 }
}

// ── Bin construction (the Celestine sweep) ───────────────────────────────────

export function binSizeFor(startMinute, endMinute) {
  return endMinute - startMinute <= 360 ? 5 : 10
}

/**
 * Sweep the window and build weighted bins.
 * offsetAt(minute) → numeric UTC offset for that local minute (handles DST
 * transition days; constant on normal days).
 */
export function buildBins({ birthdate, lat, lon, startMinute, endMinute, offsetAt }) {
  const binMinutes = binSizeFor(startMinute, endMinute)
  const bins = []
  for (let start = startMinute; start < endMinute; start += binMinutes) {
    const center = Math.min(start + binMinutes / 2, 1439)
    const hour   = Math.floor(center / 60)
    const minute = Math.round(center % 60)
    const chart  = chartAtLocation(birthdate, hour, minute, offsetAt(center), lat, lon)
    bins.push({
      startMinute: start,
      ascLon:  chart.angles.ascendant.longitude,
      mcLon:   chart.angles.midheaven.longitude,
      moonLon: chart.planets[1].longitude,
      weight:  1,
    })
  }
  return { binMinutes, startMinute, endMinute, bins }
}

// ── Segments and boundaries ──────────────────────────────────────────────────

/**
 * Group consecutive bins by rising sign.
 * Returns [{ sign, symbol, startMinute, endMinute, share }] where share is
 * the fraction of the window that sign occupies.
 */
export function buildSegments(bins, binMinutes) {
  if (!bins.length) return []
  const segments = []
  let current = null
  for (const bin of bins) {
    const sign = signNameOfLon(bin.ascLon)
    if (current && current.sign === sign) {
      current.endMinute = bin.startMinute + binMinutes
      current.binCount++
    } else {
      current = {
        sign,
        symbol: SIGN_SYMBOLS[sign] ?? '',
        startMinute: bin.startMinute,
        endMinute:   bin.startMinute + binMinutes,
        binCount: 1,
      }
      segments.push(current)
    }
  }
  for (const seg of segments) {
    seg.share = seg.binCount / bins.length
    delete seg.binCount
  }
  return segments
}

/**
 * Binary-search the minute where a sign boundary falls between two minutes
 * that are known to sit in different signs. lonAt(minute) → longitude.
 * Returns the first minute belonging to the later sign.
 */
export function refineSignBoundary(loMinute, hiMinute, lonAt) {
  const loSign = signOfLon(lonAt(loMinute))
  let lo = loMinute
  let hi = hiMinute
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (signOfLon(lonAt(mid)) === loSign) lo = mid
    else hi = mid
  }
  return hi
}

/**
 * Moon sign boundary inside the window, if any. The moon moves ~0.55°/hour
 * so it can cross at most one sign boundary in 24 hours.
 * Returns { beforeSign, afterSign, boundaryMinute } or null.
 */
export function detectMoonBoundary(bins, moonLonAt) {
  if (bins.length < 2) return null
  const first = bins[0]
  const last  = bins[bins.length - 1]
  const firstSign = signOfLon(first.moonLon)
  const lastSign  = signOfLon(last.moonLon)
  if (firstSign === lastSign) return null
  const boundaryMinute = refineSignBoundary(first.startMinute, last.startMinute, moonLonAt)
  return {
    beforeSign: SIGN_NAMES[firstSign],
    afterSign:  SIGN_NAMES[lastSign],
    boundaryMinute,
  }
}

// ── Answer weighting ─────────────────────────────────────────────────────────

/**
 * How much to trust a rising-fit answer, given the person's sun sign.
 * 1 = full trust. When the asked rising sign IS their sun sign, the
 * description likely fits them at any birth time, so "sounds like me"
 * says little (and "doesn't fit" says a lot). Shared element overlaps
 * partially. This keeps sun-sign reputation from leaking into the result.
 */
export function leakageTrust(risingSign, sunSign) {
  if (!risingSign || !sunSign) return 1
  if (risingSign === sunSign) return 0.5
  if (getElement(risingSign).element === getElement(sunSign).element) return 0.75
  return 1
}

/**
 * Apply one answer to the bins, returning a new bin array.
 * answer:
 *   { kind: 'risingFit', sign, response: 'yes'|'somewhat'|'no'|'skip' }
 *   { kind: 'moon', boundaryMinute, side: 'before'|'after'|'skip' }
 * context: { sunSign } — enables the leakage discount when present.
 */
export function applyAnswer(bins, answer, context = {}) {
  if (!answer || answer.response === 'skip' || answer.side === 'skip') {
    return bins.map(b => ({ ...b }))
  }
  if (answer.kind === 'risingFit') {
    const trust = leakageTrust(answer.sign, context.sunSign)
    let factor = RISING_FIT_FACTORS[answer.response] ?? 1.0
    if (factor > 1)      factor = 1 + (factor - 1) * trust  // praise counts less
    else if (factor < 1) factor = factor ** (2 - trust)     // rejection counts more
    return bins.map(b => ({
      ...b,
      weight: signNameOfLon(b.ascLon) === answer.sign ? b.weight * factor : b.weight,
    }))
  }
  if (answer.kind === 'moon') {
    return bins.map(b => {
      const isBefore = b.startMinute < answer.boundaryMinute
      const matched  = (answer.side === 'before') === isBefore
      return { ...b, weight: b.weight * (matched ? MOON_FACTORS.matched : MOON_FACTORS.other) }
    })
  }
  return bins.map(b => ({ ...b }))
}

// ── Life-event scoring ───────────────────────────────────────────────────────

const HARD_ASPECTS = [
  { angle: 0,   orb: RECTIFY_ANGLE_ORBS.conjunction },
  { angle: 90,  orb: RECTIFY_ANGLE_ORBS.square },
  { angle: 180, orb: RECTIFY_ANGLE_ORBS.opposition },
]

/**
 * Score bins against dated life events. Birth times whose angles received
 * tight outer-planet transits at event dates gain weight.
 *
 * eventTransits: one entry per event —
 *   { planets: { Jupiter: lon, Saturn: lon, Uranus: lon, Neptune: lon, Pluto: lon } }
 * (longitudes computed by the caller for the event date)
 */
export function scoreLifeEvents(bins, eventTransits) {
  if (!eventTransits?.length) return bins.map(b => ({ ...b }))
  return bins.map(bin => {
    let weight = bin.weight
    for (const event of eventTransits) {
      let factor = 1
      for (const [planet, planetWeight] of Object.entries(RECTIFY_TRANSIT_WEIGHTS)) {
        const transitLon = event.planets?.[planet]
        if (typeof transitLon !== 'number') continue
        for (const targetLon of [bin.ascLon, bin.mcLon]) {
          const sep = angularSeparation(transitLon, targetLon)
          for (const { angle, orb } of HARD_ASPECTS) {
            const deviation = Math.abs(sep - angle)
            if (deviation <= orb) factor += planetWeight * (1 - deviation / orb)
          }
        }
      }
      weight *= Math.min(factor, MAX_EVENT_FACTOR)
    }
    return { ...bin, weight }
  })
}

// ── Result extraction ────────────────────────────────────────────────────────

export function normalizeWeights(bins) {
  const total = bins.reduce((sum, b) => sum + b.weight, 0)
  if (total <= 0) return bins.map(b => ({ ...b, weight: 1 / bins.length }))
  return bins.map(b => ({ ...b, weight: b.weight / total }))
}

/**
 * Smallest contiguous span of bins holding at least massTarget of the
 * total weight. Returns { startMinute, endMinute, mass }.
 */
export function extractWindow(bins, binMinutes, massTarget = 0.7) {
  const normalized = normalizeWeights(bins)
  let best = null
  let lo = 0
  let mass = 0
  for (let hi = 0; hi < normalized.length; hi++) {
    mass += normalized[hi].weight
    while (mass - normalized[lo].weight >= massTarget && lo < hi) {
      mass -= normalized[lo].weight
      lo++
    }
    if (mass >= massTarget) {
      const span = hi - lo + 1
      if (!best || span < best.span) {
        best = { span, lo, hi, mass }
      }
    }
  }
  if (!best) {
    return {
      startMinute: normalized[0].startMinute,
      endMinute:   normalized[normalized.length - 1].startMinute + binMinutes,
      mass: 1,
    }
  }
  return {
    startMinute: normalized[best.lo].startMinute,
    endMinute:   normalized[best.hi].startMinute + binMinutes,
    mass: best.mass,
  }
}

/** Probability mass per rising sign, sorted descending */
export function signShares(bins) {
  const normalized = normalizeWeights(bins)
  const shares = new Map()
  for (const bin of normalized) {
    const sign = signNameOfLon(bin.ascLon)
    shares.set(sign, (shares.get(sign) ?? 0) + bin.weight)
  }
  return [...shares.entries()]
    .map(([sign, share]) => ({ sign, symbol: SIGN_SYMBOLS[sign] ?? '', share }))
    .sort((a, b) => b.share - a.share)
}

/**
 * Confidence tier for the result copy.
 *   strong:   one sign is very likely and the window is under an hour
 *   moderate: one sign leads and the window shrank to half or less
 *   light:    everything else (including all questions skipped)
 */
export function confidenceTier({ topSignShare, windowMinutes, originalMinutes }) {
  if (topSignShare >= 0.8 && windowMinutes <= 60) return 'strong'
  if (topSignShare >= 0.6 && windowMinutes <= originalMinutes / 2) return 'moderate'
  return 'light'
}
