import { NextResponse } from 'next/server'
import { chartAt, chartAtLocation, ianaToOffset } from '@/lib/astrology-core'
import {
  windowFromTimeKnowledge,
  buildBins,
  buildSegments,
  refineSignBoundary,
  detectMoonBoundary,
  applyAnswer,
  scoreLifeEvents,
  extractWindow,
  signShares,
  confidenceTier,
  minuteToHHMM,
} from '@/lib/astrology-core/rectify'
import { buildQuestions } from '@/utils/hourQuestions'

// ── Rate limiting (same pattern as /api/journey) ─────────────────────────────
// Prepare sweeps ~150-300 Celestine charts per request.

const RATE_LIMIT  = 10
const RATE_WINDOW = 60_000
const _rateMap    = new Map()

function isRateLimited(ip) {
  const now   = Date.now()
  const entry = _rateMap.get(ip)
  if (!entry || now - entry.start > RATE_WINDOW) {
    _rateMap.set(ip, { start: now, count: 1 })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

// ── Limits / guards ──────────────────────────────────────────────────────────

const MAX_BINS    = 300
const MAX_EVENTS  = 3
const MAX_ANSWERS = 10
const POLAR_LAT   = 66 // ascendant math loses its footing near the poles

// Transiting bodies for life-event scoring (chart.planets indices)
const EVENT_PLANETS = [
  ['Jupiter', 5], ['Saturn', 6], ['Uranus', 7], ['Neptune', 8], ['Pluto', 9],
]

const round2 = n => Math.round(n * 100) / 100

function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function isValidBirthdate(birthdate) {
  if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return false
  const year = Number(birthdate.slice(0, 4))
  return year >= 1900 && year <= new Date().getFullYear()
}

/**
 * UTC offset for a local minute of the birth day. Constant on normal days;
 * recomputed per minute on DST transition days so bins on either side of
 * the clock change get the right sky.
 */
function makeOffsetAt(iana, birthdate) {
  const base = ianaToOffset(iana, birthdate)
  if (!iana) return () => base

  const offsetAtInstant = (utcMs) => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: iana, timeZoneName: 'shortOffset',
      }).formatToParts(new Date(utcMs))
      const label = parts.find(p => p.type === 'timeZoneName')?.value ?? ''
      if (label === 'GMT') return 0
      const match = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/)
      if (!match) return base
      return (match[1] === '+' ? 1 : -1) * (Number(match[2]) + Number(match[3] ?? 0) / 60)
    } catch {
      return base
    }
  }

  const [year, month, day] = birthdate.split('-').map(Number)
  // Anchor local midnight using the offset in force AT midnight (base is
  // sampled at noon, which is wrong side of a DST change for morning bins)
  const midnightOffset = offsetAtInstant(Date.UTC(year, month - 1, day) - base * 3_600_000)
  const dayStartUtc    = Date.UTC(year, month - 1, day) - midnightOffset * 3_600_000
  const endOffset      = offsetAtInstant(dayStartUtc + 24 * 3_600_000)
  if (midnightOffset === endOffset) return () => midnightOffset
  return minute => offsetAtInstant(dayStartUtc + minute * 60_000)
}

// ── Step: prepare ────────────────────────────────────────────────────────────

function handlePrepare(body) {
  const { birthdate, place, timeKnowledge } = body
  if (!isValidBirthdate(birthdate)) return badRequest('birthdate is required (YYYY-MM-DD, 1900 or later)')

  const lat = Number(place?.lat)
  const lon = Number(place?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return badRequest('a birthplace is required')
  }
  if (Math.abs(lat) > POLAR_LAT) {
    return NextResponse.json({
      error: 'polar',
      message: 'Rising sign math tends to lose its footing this close to the poles, so The Hour sits this one out. Charts for polar births are a genuinely hard problem.',
    }, { status: 422 })
  }

  const { startMinute, endMinute } = windowFromTimeKnowledge(timeKnowledge)
  const offsetAt = makeOffsetAt(typeof place?.tz === 'string' ? place.tz : null, birthdate)

  const { binMinutes, bins } = buildBins({ birthdate, lat, lon, startMinute, endMinute, offsetAt })
  const segments = buildSegments(bins, binMinutes)

  // Pin each sign boundary to the minute
  const ascLonAt = minute => chartAtLocation(
    birthdate, Math.floor(minute / 60), Math.round(minute % 60), offsetAt(minute), lat, lon,
  ).angles.ascendant.longitude
  for (let i = 1; i < segments.length; i++) {
    const boundary = refineSignBoundary(
      segments[i - 1].endMinute - binMinutes, segments[i].startMinute, ascLonAt,
    )
    segments[i - 1].endMinute = boundary
    segments[i].startMinute   = boundary
  }

  const moonLonAt = minute => chartAtLocation(
    birthdate, Math.floor(minute / 60), Math.round(minute % 60), offsetAt(minute), lat, lon,
  ).planets[1].longitude
  const moonBoundary = detectMoonBoundary(bins, moonLonAt)

  const { questions, singleSign } = buildQuestions({ segments, moonBoundary })
  const sunSign = chartAt(birthdate, 12, 0, 0).planets[0]?.signName ?? null

  return NextResponse.json({
    binsMeta: { startMinute, endMinute, binMinutes },
    sunSign,
    ascLon:  bins.map(b => round2(b.ascLon)),
    mcLon:   bins.map(b => round2(b.mcLon)),
    moonLon: bins.map(b => round2(b.moonLon)),
    segments,
    moonBoundary,
    questions,
    singleSign,
  })
}

// ── Step: score ──────────────────────────────────────────────────────────────

function isLonArray(arr, length) {
  return Array.isArray(arr) && arr.length === length &&
    arr.every(n => Number.isFinite(n) && n >= 0 && n < 360)
}

function handleScore(body) {
  const { birthdate, binsMeta, ascLon, mcLon, moonLon, answers = [], events = [] } = body
  if (!isValidBirthdate(birthdate)) return badRequest('birthdate is required (YYYY-MM-DD, 1900 or later)')

  const { startMinute, endMinute, binMinutes } = binsMeta ?? {}
  if (![startMinute, endMinute, binMinutes].every(Number.isFinite) ||
      binMinutes <= 0 || endMinute <= startMinute) {
    return badRequest('binsMeta is malformed')
  }
  const binCount = Math.ceil((endMinute - startMinute) / binMinutes)
  if (binCount > MAX_BINS) return badRequest('too many bins')
  if (!isLonArray(ascLon, binCount) || !isLonArray(mcLon, binCount) || !isLonArray(moonLon, binCount)) {
    return badRequest('longitude arrays are malformed')
  }
  if (!Array.isArray(answers) || answers.length > MAX_ANSWERS) return badRequest('answers are malformed')
  if (!Array.isArray(events) || events.length > MAX_EVENTS) return badRequest('events are malformed')

  let bins = ascLon.map((asc, i) => ({
    startMinute: startMinute + i * binMinutes,
    ascLon: asc, mcLon: mcLon[i], moonLon: moonLon[i], weight: 1,
  }))

  // Sun sign computed server-side so the leakage discount can't be spoofed
  const sunSign = chartAt(birthdate, 12, 0, 0).planets[0]?.signName ?? null
  for (const answer of answers) {
    if (answer?.kind !== 'risingFit' && answer?.kind !== 'moon') continue
    bins = applyAnswer(bins, answer, { sunSign })
  }

  const eventTransits = []
  for (const event of events) {
    if (!/^\d{4}-\d{2}$/.test(event?.date ?? '')) continue
    const year = Number(event.date.slice(0, 4))
    if (year < 1900 || year > new Date().getFullYear()) continue
    const sky = chartAt(`${event.date}-15`, 12, 0, 0)
    const planets = {}
    for (const [name, index] of EVENT_PLANETS) {
      const lon = sky.planets[index]?.longitude
      if (Number.isFinite(lon)) planets[name] = lon
    }
    eventTransits.push({ planets })
  }
  bins = scoreLifeEvents(bins, eventTransits)

  const window     = extractWindow(bins, binMinutes)
  const candidates = signShares(bins)
  const tier = confidenceTier({
    topSignShare:    candidates[0]?.share ?? 0,
    windowMinutes:   window.endMinute - window.startMinute,
    originalMinutes: endMinute - startMinute,
  })

  return NextResponse.json({
    window: {
      startMinute: window.startMinute,
      endMinute:   window.endMinute,
      startLabel:  minuteToHHMM(window.startMinute),
      endLabel:    minuteToHHMM(Math.min(window.endMinute, 1439)),
      mass:        round2(window.mass),
    },
    risingCandidates: candidates.slice(0, 3).map(c => ({ ...c, share: round2(c.share) })),
    tier,
    originalMinutes: endMinute - startMinute,
    eventsUsed: eventTransits.length,
  })
}

// ── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/hour
 *
 * step 'prepare': { birthdate, place: {lat, lon, tz, name}, timeKnowledge }
 *   → bins (angle/moon longitudes), rising segments, moon boundary, questions
 * step 'score':   { birthdate, binsMeta, ascLon, mcLon, moonLon, answers, events }
 *   → narrowed window, rising candidates, confidence tier
 *
 * Stateless: the client holds the prepare payload and echoes it back with
 * answers. Echoed arrays are validated and clamped, never trusted for size.
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    if (body?.step === 'prepare') return handlePrepare(body)
    if (body?.step === 'score')   return handleScore(body)
    return badRequest('step must be prepare or score')
  } catch (err) {
    console.error('[/api/hour] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
