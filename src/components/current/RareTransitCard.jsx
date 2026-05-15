import { PLANET_THEMES, RARITY_LABELS } from './currentData'

// Average daily motion in degrees (used to estimate transit windows)
const AVG_DAILY_MOTION = {
  Jupiter: 0.083, Saturn: 0.033, Uranus: 0.012, Neptune: 0.006, Pluto: 0.004,
}

const ORB_LIMITS = {
  conjunction: 6, opposition: 4, square: 3,
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtMonthYear(date) {
  return `${MONTH_ABBR[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Estimate the active window for a transit based on current orb,
 * phase (applying/separating), planet speed, and orb limit.
 */
function estimateWindow(transit) {
  const speed = AVG_DAILY_MOTION[transit.transitingPlanet]
  const limit = ORB_LIMITS[transit.aspect]
  if (!speed || !limit) return null

  const now = new Date()
  let daysBack, daysForward

  if (transit.phase === 'applying') {
    // Entered orb (limit - orb) days ago, will exit (orb + limit) days from now
    daysBack    = (limit - transit.orb) / speed
    daysForward = (transit.orb + limit) / speed
  } else {
    // Entered orb (limit + orb) days ago, will exit (limit - orb) days from now
    daysBack    = (limit + transit.orb) / speed
    daysForward = (limit - transit.orb) / speed
  }

  const start = new Date(now.getTime() - daysBack * 86_400_000)
  const end   = new Date(now.getTime() + daysForward * 86_400_000)

  return { start, end }
}

export default function RareTransitCard({ rareTransits, exactTransits }) {
  const hasRare  = rareTransits?.length > 0
  const hasExact = exactTransits?.length > 0
  if (!hasRare && !hasExact) return null

  return (
    <div className="current-card current-rare">
      {hasRare && (
        <>
          <h4 className="current-card-heading">Rare Moments</h4>
          {rareTransits.map((r, i) => {
            const color = PLANET_THEMES[r.transit.transitingPlanet]?.color ?? 'var(--gold)'
            const window = estimateWindow(r.transit)
            return (
              <div key={i} className="current-rare-item" style={{ '--accent': color }}>
                <span className="current-rare-badge">{RARITY_LABELS[r.rarity] ?? r.rarity}</span>
                <p className="current-rare-who">
                  <strong>{r.memberName}</strong>
                  {r.age != null && <span className="current-age-tag">age {r.age}</span>}
                  {' '}&middot; {r.title}
                </p>
                <p className="current-rare-desc">{r.description}</p>
                <p className="current-rare-detail">
                  {r.transit.transitingPlanet} {r.transit.aspectSymbol} {r.transit.natalPlanet}
                  {window && <> &middot; ~{fmtMonthYear(window.start)} through ~{fmtMonthYear(window.end)}</>}
                </p>
              </div>
            )
          })}
        </>
      )}
      {hasExact && (
        <>
          <h4 className="current-card-heading" style={hasRare ? { marginTop: '0.5rem' } : undefined}>
            Peak Intensity
          </h4>
          <p className="current-card-note" style={{ marginBottom: '0.25rem' }}>
            These transits are at exact alignment right now
          </p>
          {exactTransits.map((e, i) => {
            const color = PLANET_THEMES[e.transit.transitingPlanet]?.color ?? 'var(--gold)'
            return (
              <div key={i} className="current-exact-item" style={{ '--accent': color }}>
                <span className="current-exact-dot" />
                <strong>{e.memberName}</strong> &middot;{' '}
                {e.transit.transitingGlyph}{e.transit.aspectSymbol}{e.transit.natalGlyph}{' '}
                {e.title}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
