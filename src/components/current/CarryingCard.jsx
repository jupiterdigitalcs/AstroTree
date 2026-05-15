import { useState } from 'react'
import { hasChapter, getChapter } from '../../utils/transitChapters'
import { PLANET_THEMES } from './currentData'

// Average daily motion in degrees (for estimating transit windows)
const AVG_DAILY_MOTION = {
  Venus: 1.2, Mars: 0.52, Jupiter: 0.083, Saturn: 0.033, Uranus: 0.012, Neptune: 0.006, Pluto: 0.004,
}
const ORB_LIMITS = { conjunction: 6, opposition: 4, square: 3 }
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function estimateWindow(transit) {
  const speed = AVG_DAILY_MOTION[transit.transitingPlanet]
  const limit = ORB_LIMITS[transit.aspect]
  if (!speed || !limit) return null

  const now = new Date()
  let daysBack, daysForward
  if (transit.phase === 'applying') {
    daysBack    = (limit - transit.orb) / speed
    daysForward = (transit.orb + limit) / speed
  } else {
    daysBack    = (limit + transit.orb) / speed
    daysForward = (limit - transit.orb) / speed
  }
  const start = new Date(now.getTime() - daysBack * 86_400_000)
  const end   = new Date(now.getTime() + daysForward * 86_400_000)
  return `~${MONTH_ABBR[start.getMonth()]} ${start.getFullYear()} through ~${MONTH_ABBR[end.getMonth()]} ${end.getFullYear()}`
}

/**
 * Summarize what each member is carrying right now.
 * Tap a member to expand and see the chapter title + description
 * for each of their active transits.
 */
export default function CarryingCard({ members, memberTransits, rareTransits, quickHits, memberAges }) {
  if (!memberTransits) return null

  const [expanded, setExpanded] = useState({})

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // Build per-member summary with full transit details
  const rareIds = new Set((rareTransits ?? []).map(r => r.memberId))

  const summaries = members.map(m => {
    const allTransits = memberTransits[m.id] ?? []
    const age = memberAges?.[m.id] ?? null
    const isChild = age != null && age < 13

    // Curated transits with chapter details
    const curated = allTransits
      .filter(t => hasChapter(t.transitingPlanet, t.aspect, t.natalPlanet))
      .map(t => {
        const chapter = getChapter(t.transitingPlanet, t.aspect, t.natalPlanet, age ?? 99)
        return {
          transit: t,
          title: chapter.title,
          description: chapter.description,
          rarity: chapter.rarity,
          color: PLANET_THEMES[t.transitingPlanet]?.color ?? 'var(--gold)',
          window: estimateWindow(t),
        }
      })

    const quick = (quickHits ?? []).filter(h => h.memberId === m.id)
    const hasRare = rareIds.has(m.id)

    return {
      id: m.id,
      name: m.name,
      age: isChild ? age : null,
      curated,
      quick,
      hasRare,
      total: curated.length + quick.length,
    }
  })

  // Sort: most transits first, then rare, then alphabetical
  summaries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    if (b.hasRare !== a.hasRare) return b.hasRare ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  const active = summaries.filter(s => s.total > 0 || s.hasRare)
  const quiet  = summaries.filter(s => s.total === 0 && !s.hasRare)
  const isSolo = members.length === 1

  return (
    <div className="current-card current-activity">
      <h4 className="current-card-heading">
        {isSolo ? "What You're Carrying" : "Who's Carrying What"}
      </h4>
      <p className="current-card-whisper">
        {isSolo
          ? 'These are the active transits touching your chart right now. Tap to see more.'
          : 'A snapshot of what each person is moving through right now. Tap a name to see details.'
        }
      </p>
      {active.map(s => {
        const isOpen = expanded[s.id] ?? isSolo
        return (
          <div key={s.id} className="current-carrying-member">
            <button
              className="current-carrying-header"
              onClick={() => toggle(s.id)}
              aria-expanded={isOpen}
            >
              <span className="current-carrying-name">
                <strong>{s.name}</strong>
                {s.age != null && <span className="current-age-tag">age {s.age}</span>}
              </span>
              <span className="current-carrying-summary">
                {s.curated.length > 0 && <>{s.curated.length} major</>}
                {s.curated.length > 0 && s.quick.length > 0 && ', '}
                {s.quick.length > 0 && <>{s.quick.length} quick</>}
                {s.hasRare && <span className="current-carrying-rare"> (rare)</span>}
              </span>
              <span className={`current-carrying-chevron${isOpen ? ' current-carrying-chevron--open' : ''}`}>
                &#x203A;
              </span>
            </button>

            {isOpen && (
              <div className="current-carrying-details">
                {s.curated.map((c, i) => (
                  <div key={i} className="current-carrying-transit" style={{ '--accent': c.color }}>
                    <span className="current-carrying-dot" />
                    <div className="current-carrying-transit-text">
                      <p className="current-carrying-title">
                        {c.transit.transitingGlyph}{c.transit.aspectSymbol}{c.transit.natalGlyph}{' '}
                        {c.title}
                        {c.transit.exact && <span className="current-exact-badge">exact</span>}
                      </p>
                      <p className="current-carrying-desc">{c.description}</p>
                      <p className="current-carrying-meta">
                        {c.window ?? (c.transit.phase === 'applying' ? 'Building' : 'Winding down')}
                      </p>
                    </div>
                  </div>
                ))}
                {s.quick.map((h, i) => {
                  const color = h.transit.transitingPlanet === 'Venus' ? '#c9a84c' : '#cc6655'
                  return (
                    <div key={`q${i}`} className="current-carrying-transit current-carrying-transit--quick" style={{ '--accent': color }}>
                      <span className="current-carrying-dot" />
                      <div className="current-carrying-transit-text">
                        <p className="current-carrying-title">
                          {h.transit.transitingPlanet} {h.verb} {h.transit.natalPlanet}
                        </p>
                        {h.blurb && <p className="current-carrying-desc">{h.blurb}</p>}
                        {estimateWindow(h.transit) && (
                          <p className="current-carrying-meta">{estimateWindow(h.transit)}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      {quiet.length > 0 && (
        <p className="current-card-note current-card-note--quiet">
          Clear skies: <strong>{quiet.map(s => s.name).join(', ')}</strong>
          {' '}&middot; steady ground right now
        </p>
      )}
    </div>
  )
}
