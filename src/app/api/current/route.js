import { NextResponse }       from 'next/server'
import { calcGroupTransits, calcGroupQuickTransits, chartAt, getNatalPlanets, ianaToOffset, DEFAULT_TIMEZONE }  from '@/lib/astrology-core'
import { analyzeGroupTransits } from '@/lib/astrology-core/groupCurrent'

// ── Rate limiting ────────────────────────────────────────────────────────────
// Group transits: ~2 Celestine calls per member. Cheaper than journey but
// still worth limiting.

const RATE_LIMIT  = 30
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

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcAge(birthdate) {
  const [y, m, d] = birthdate.split('-').map(Number)
  const now = new Date()
  let age = now.getFullYear() - y
  const mDiff = now.getMonth() + 1 - m
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < d)) age--
  return age
}

// ── Route handler ────────────────────────────────────────────────────────────

/**
 * POST /api/current
 *
 * Body: {
 *   members: [
 *     { id, name, birthdate: 'YYYY-MM-DD', birthTime?: 'HH:MM', birthTimezone?: string }
 *   ]
 * }
 *
 * Returns: {
 *   date:            'YYYY-MM-DD',
 *   memberTransits:  { [id]: Transit[] },
 *   groupAnalysis:   GroupAnalysis
 * }
 */
export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const { members } = body ?? {}

    if (!Array.isArray(members) || members.length === 0) {
      return NextResponse.json({ error: 'members array is required' }, { status: 400 })
    }

    if (members.length > 30) {
      return NextResponse.json({ error: 'Maximum 30 members' }, { status: 400 })
    }

    // Validate each member has at minimum an id and valid birthdate
    const validMembers = []
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    for (const m of members) {
      if (!m.id || !m.birthdate || !dateRegex.test(m.birthdate)) continue
      validMembers.push({
        id:            m.id,
        name:          (m.name ?? '').slice(0, 200),
        birthdate:     m.birthdate,
        birthTime:     m.birthTime ?? null,
        birthTimezone: m.birthTimezone ?? null,
      })
    }

    if (validMembers.length === 0) {
      return NextResponse.json({ error: 'No valid members provided' }, { status: 400 })
    }

    const today = new Date()

    // Split members by age: babies (<3) get Moon-only treatment,
    // everyone else gets full transit analysis
    const memberAges = {}
    const memberNames = {}
    const olderMembers = []
    const babies = []

    for (const m of validMembers) {
      const age = calcAge(m.birthdate)
      memberAges[m.id] = age
      memberNames[m.id] = m.name || m.id
      if (age < 3) {
        babies.push(m)
      } else {
        olderMembers.push(m)
      }
    }

    // Full transit analysis for 3+ year olds only
    const memberTransits = calcGroupTransits(olderMembers, today)
    const quickTransits  = calcGroupQuickTransits(olderMembers, today)

    // For babies: check all transits but only surface Moon-targeted ones
    // (babies live through their Moon — their mood IS the group impact)
    // Also track the transiting Moon's current position and look-ahead
    const babyTransits = calcGroupTransits(babies, today)
    const babyQuick    = calcGroupQuickTransits(babies, today)

    // Get today's transiting Moon position
    const todayStr   = today.toISOString().split('T')[0]
    const todayChart = chartAt(todayStr, 12, 0, 0)
    const transitMoon = todayChart.planets[1]
    const moonSign   = transitMoon?.signName ?? null
    const moonLon    = transitMoon?.longitude ?? null

    const babyMoods = []
    for (const baby of babies) {
      // Outer/inner planet transits hitting baby's natal Moon
      const allTransits = [
        ...(babyTransits[baby.id] ?? []),
        ...(babyQuick[baby.id] ?? []),
      ].filter(t => t.natalPlanet === 'Moon')

      // Baby's natal Moon position (need birth time for accuracy)
      let natalMoonSign = null
      let natalMoonLon  = null
      let moonReturn    = null

      if (baby.birthTime) {
        const tz = baby.birthTimezone ? ianaToOffset(baby.birthTimezone, baby.birthdate) : DEFAULT_TIMEZONE
        const natalPlanets = getNatalPlanets(baby.birthdate, baby.birthTime, tz)
        const natalMoon = natalPlanets[1]
        if (natalMoon) {
          natalMoonSign = natalMoon.signName
          natalMoonLon  = natalMoon.longitude

          // Look ahead: when does transiting Moon next conjunct natal Moon?
          // Moon moves ~13°/day. Calculate angular distance forward.
          if (moonLon != null) {
            let degreesAhead = (natalMoon.longitude - moonLon + 360) % 360
            if (degreesAhead < 2) degreesAhead += 360 // if nearly exact, show next pass
            const daysAhead = Math.round(degreesAhead / 13)
            const returnDate = new Date(today)
            returnDate.setDate(returnDate.getDate() + daysAhead)
            moonReturn = returnDate.toISOString().split('T')[0]
          }
        }
      }

      // Current transiting Moon's aspect to baby's natal Moon
      let moonMoodNow = null
      if (natalMoonLon != null && moonLon != null) {
        const sep = Math.abs(((moonLon - natalMoonLon + 180) % 360) - 180)
        if (sep <= 8)                             moonMoodNow = 'conjunction'
        else if (Math.abs(sep - 90)  <= 6)        moonMoodNow = 'square'
        else if (Math.abs(sep - 180) <= 6)        moonMoodNow = 'opposition'
        else if (Math.abs(sep - 120) <= 5)        moonMoodNow = 'trine'
      }

      babyMoods.push({
        id:            baby.id,
        name:          memberNames[baby.id],
        age:           memberAges[baby.id],
        hasBirthTime:  !!baby.birthTime,
        transits:      allTransits.sort((a, b) => a.orb - b.orb),
        natalMoonSign,
        moonMoodNow,
        moonReturn,
        transitMoonSign: moonSign,
      })
    }

    const groupAnalysis = analyzeGroupTransits(memberTransits, memberNames, quickTransits, memberAges)

    // Attach baby moods and member ages to the analysis
    groupAnalysis.babyMoods  = babyMoods
    groupAnalysis.memberAges = memberAges

    return NextResponse.json({
      date:           today.toISOString().split('T')[0],
      memberTransits,
      groupAnalysis,
    })
  } catch (err) {
    console.error('[/api/current] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
