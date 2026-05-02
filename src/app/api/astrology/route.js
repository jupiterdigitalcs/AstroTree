import { NextResponse } from 'next/server'
import {
  ianaToOffset,
  calcMoon,
  calcInnerPlanets,
  calcOuterPlanets,
  calcSunAtTime,
  calcIngressWarnings,
  calcTimezoneWarnings,
  calcNatalAspectsForPerson,
  DEFAULT_TIMEZONE,
} from '@/lib/astrology-core'

// ── Rate limiting ────────────────────────────────────────────────────────────

const BATCH_LIMIT = 100
const RATE_LIMIT  = 60
const RATE_WINDOW = 60_000

const _rateMap = new Map()

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

// ── Calculator registry ──────────────────────────────────────────────────────

const CALCULATORS = {
  moon:              calcMoon,
  innerPlanets:      calcInnerPlanets,
  outerPlanets:      calcOuterPlanets,
  sunAtTime:         calcSunAtTime,
  ingressWarnings:   calcIngressWarnings,
  timezoneWarnings:  calcTimezoneWarnings,
  natalAspects:      calcNatalAspectsForPerson,
}

// ── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/astrology
 *
 * Single:  { birthdate, birthTime?, birthTimezone?, calculations: ['moon', ...] }
 * Batch:   { members: [{ id, birthdate, birthTime?, birthTimezone? }], calculations: [...] }
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
      const calcs   = body.calculations ?? ['moon']
      const results = {}
      for (const member of body.members) {
        if (!member.birthdate || !member.id) continue
        const tz   = member.birthTimezone ? ianaToOffset(member.birthTimezone, member.birthdate) : DEFAULT_TIMEZONE
        const data = {}
        for (const calc of calcs) {
          const fn = CALCULATORS[calc]
          if (!fn) continue
          data[calc] = calc === 'timezoneWarnings'
            ? fn(member.birthdate, member.birthTime ?? null, member.birthTimezone ?? null)
            : fn(member.birthdate, member.birthTime ?? null, tz)
        }
        results[member.id] = data
      }
      return NextResponse.json(results)
    }

    // Single mode
    if (!body.birthdate) return NextResponse.json({ error: 'Missing birthdate' }, { status: 400 })
    const tz    = body.birthTimezone ? ianaToOffset(body.birthTimezone, body.birthdate) : DEFAULT_TIMEZONE
    const calcs = body.calculations ?? ['moon']
    const data  = {}
    for (const calc of calcs) {
      const fn = CALCULATORS[calc]
      if (!fn) continue
      data[calc] = calc === 'timezoneWarnings'
        ? fn(body.birthdate, body.birthTime ?? null, body.birthTimezone ?? null)
        : fn(body.birthdate, body.birthTime ?? null, tz)
    }
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
