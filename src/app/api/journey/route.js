import { NextResponse }        from 'next/server'
import { calcTransitTimeline } from '@/lib/astrology-core'
import { getChapter }          from '@/utils/transitChapters'

// ── Rate limiting ────────────────────────────────────────────────────────────
// Timeline calculation is expensive (~3k Celestine calls). Lower limit than
// the general astrology endpoint.

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function serializeEvent(ev) {
  return {
    // Planet info
    transitingPlanet: ev.transitingPlanet,
    transitingGlyph:  ev.transitingGlyph,
    natalPlanet:      ev.natalPlanet,
    natalGlyph:       ev.natalGlyph,
    aspect:           ev.aspect,
    aspectSymbol:     ev.aspectSymbol,
    // Dates as ISO strings
    firstPeakDate:    ev.firstPeakDate?.toISOString() ?? null,
    lastPeakDate:     ev.lastPeakDate?.toISOString()  ?? null,
    orbStart:         ev.orbStart?.toISOString()      ?? null,
    orbEnd:           ev.orbEnd?.toISOString()        ?? null,
    passes:           ev.passes ?? 1,
    // Chapter copy
    ...getChapter(ev.transitingPlanet, ev.aspect, ev.natalPlanet),
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/journey
 *
 * Body: {
 *   birthdate:      'YYYY-MM-DD'   (required)
 *   birthTime?:     'HH:MM'        (optional — enables Moon chapters)
 *   birthTimezone?: string         (optional IANA timezone — e.g. 'America/New_York')
 * }
 *
 * Returns: {
 *   events: TransitChapter[]  (sorted chronologically, birth → age 85)
 *   hasBirthTime: boolean     (so the client knows whether Moon chapters are included)
 * }
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const { birthdate, birthTime = null, birthTimezone = null } = body ?? {}

    if (!birthdate || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      return NextResponse.json({ error: 'birthdate is required (YYYY-MM-DD)' }, { status: 400 })
    }

    const [year, month, day] = birthdate.split('-').map(Number)
    if (year < 1900 || year > new Date().getFullYear()) {
      return NextResponse.json({ error: 'birthdate out of range' }, { status: 400 })
    }

    const startDate = new Date(Date.UTC(year, month - 1, day))
    const endDate   = new Date(Date.UTC(year + 85, month - 1, day))

    const events = calcTransitTimeline({
      birthdate,
      birthTime,
      birthTimezone,
      startDate,
      endDate,
    })

    return NextResponse.json({
      events:       events.map(serializeEvent),
      hasBirthTime: !!birthTime,
    })
  } catch (err) {
    console.error('[/api/journey] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
