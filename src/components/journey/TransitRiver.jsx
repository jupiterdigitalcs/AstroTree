'use client'

import { useEffect, useRef } from 'react'
import RiverCard             from './RiverCard.jsx'

// ── Landmark filter ───────────────────────────────────────────────────────────
// Used to thin out past events — only show truly major transits from the distant
// past, not every Jupiter hit.

const LANDMARK_KEYS = new Set([
  'Saturn_conjunction_Saturn',     // Saturn Return
  'Jupiter_conjunction_Jupiter',   // Jupiter Return
  'Saturn_conjunction_Sun',
  'Saturn_opposition_Sun',
  'Saturn_conjunction_Moon',
  'Saturn_conjunction_Venus',
  'Uranus_conjunction_Sun',  'Uranus_square_Sun',  'Uranus_opposition_Sun',
  'Uranus_conjunction_Venus',
  'Uranus_conjunction_Moon', 'Uranus_square_Moon', 'Uranus_opposition_Moon',
  'Neptune_conjunction_Sun', 'Neptune_square_Sun',
  'Neptune_conjunction_Venus', 'Neptune_square_Moon',
  'Pluto_conjunction_Sun',   'Pluto_square_Sun',   'Pluto_opposition_Sun',
  'Pluto_conjunction_Moon',  'Pluto_square_Moon',
  'Pluto_conjunction_Venus',
])

function isLandmark(ev) {
  return LANDMARK_KEYS.has(`${ev.transitingPlanet}_${ev.aspect}_${ev.natalPlanet}`)
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const TWO_YEARS_MS = 2 * 365.25 * 86_400_000

function categorize(events) {
  const now = Date.now()

  // Active: orbStart <= today <= orbEnd — currently within orb
  const active = events.filter(ev =>
    new Date(ev.orbStart).getTime() <= now &&
    new Date(ev.orbEnd).getTime()   >= now
  )
  const activeKeys = new Set(active.map(ev => ev.firstPeakDate))

  // Past: last peak before today AND not currently active
  const past = events
    .filter(ev => new Date(ev.lastPeakDate).getTime() < now && !activeKeys.has(ev.firstPeakDate))
    // Within 2yr of today: keep all. Older: landmarks only
    .filter(ev => now - new Date(ev.lastPeakDate).getTime() < TWO_YEARS_MS || isLandmark(ev))

  // Future: first peak is after today AND not currently active
  // Cap at first 10 upcoming events
  const future = events
    .filter(ev => new Date(ev.firstPeakDate).getTime() > now && !activeKeys.has(ev.firstPeakDate))
    .slice(0, 10)

  return { past, active, future }
}

function currentYear() {
  return new Date().getFullYear()
}

function currentAge(birthdate) {
  const born = new Date(birthdate + 'T12:00:00Z')
  const now  = new Date()
  let age = now.getUTCFullYear() - born.getUTCFullYear()
  const m = now.getUTCMonth() - born.getUTCMonth()
  if (m < 0 || (m === 0 && now.getUTCDate() < born.getUTCDate())) age--
  return age
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * @param {object[]} events — serialized TransitChapter[] from /api/journey
 * @param {{ name, birthdate }} person
 * @param {boolean} hasBirthTime
 * @param {function} onReset
 */
export default function TransitRiver({ events, person, hasBirthTime, onReset }) {
  const nowRef = useRef(null)

  // Scroll "Now" into view on first render
  useEffect(() => {
    if (nowRef.current) {
      nowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const { past, active, future } = categorize(events)

  // Count how many times each transit type occurs across the full lifetime.
  // Used to personalize the frequency label on rare/once transits.
  const lifetimeCounts = {}
  for (const ev of events) {
    const key = `${ev.transitingPlanet}_${ev.aspect}_${ev.natalPlanet}`
    lifetimeCounts[key] = (lifetimeCounts[key] ?? 0) + 1
  }

  const displayName = person?.name ?? 'Your'
  const headerName  = person?.name ? `${person.name}'s Journey` : 'Your Journey'

  return (
    <div className="journey-river-wrap">
      {/* Sticky header */}
      <div className="journey-river-header">
        <span className="journey-river-name">✦ {headerName}</span>
        <div className="journey-river-header-right">
          <span className="journey-beta-badge journey-beta-badge--sm">BETA</span>
          <button className="journey-river-reset" onClick={onReset}>
            Start over
          </button>
        </div>
      </div>

      {/* The river */}
      <div className="journey-river">

        {/* ── Past ── */}
        <div className="journey-section-label"><span>Past chapters</span></div>

        {past.length === 0 ? (
          <p className="journey-empty-section">No major past chapters yet.</p>
        ) : (
          past.map((ev, i) => (
            <RiverCard
              key={`past-${i}`}
              event={ev}
              timing="past"
              birthdate={person.birthdate}
              lifetimeCount={lifetimeCounts[`${ev.transitingPlanet}_${ev.aspect}_${ev.natalPlanet}`]}
            />
          ))
        )}

        {/* ── Now marker ── */}
        <div className="journey-now" ref={nowRef}>
          <div className="journey-now-dot" />
          <div className="journey-now-text">
            <span className="journey-now-label">You are here</span>
            <span className="journey-now-year">
              {currentYear()} · {displayName === 'Your' ? 'age' : 'age'} {currentAge(person.birthdate)}
            </span>
          </div>
        </div>

        {/* ── Happening Now ── */}
        {active.length > 0 && (
          <>
            <div className="journey-section-label journey-section-label--active"><span>Happening now</span></div>
            {active.map((ev, i) => (
              <RiverCard
                key={`active-${i}`}
                event={ev}
                timing="present"
                birthdate={person.birthdate}
                lifetimeCount={lifetimeCounts[`${ev.transitingPlanet}_${ev.aspect}_${ev.natalPlanet}`]}
              />
            ))}
          </>
        )}

        {/* ── Future ── */}
        <div className="journey-section-label"><span>Chapters ahead</span></div>

        {!hasBirthTime && (
          <p className="journey-moon-nudge">
            <strong>Moon chapters not included.</strong> Add your birth time on the
            entry form to unlock Moon transits — they tend to be the most emotional ones.
          </p>
        )}

        {future.length === 0 ? (
          <p className="journey-empty-section">No major upcoming chapters in this window.</p>
        ) : (
          future.map((ev, i) => (
            <RiverCard
              key={`future-${i}`}
              event={ev}
              timing="future"
              birthdate={person.birthdate}
              lifetimeCount={lifetimeCounts[`${ev.transitingPlanet}_${ev.aspect}_${ev.natalPlanet}`]}
            />
          ))
        )}

      </div>
    </div>
  )
}
