// Planet colors — used for the dot, accent bar, and glyph
const PLANET_COLORS = {
  Jupiter: '#c9a84c',
  Saturn:  '#8899cc',
  Uranus:  '#56c8c0',
  Neptune: '#7bafd4',
  Pluto:   '#b06cbf',
}

const COUNT_WORDS = ['once', 'twice', 'three times', 'four times', 'five times']

/**
 * Returns a personalized frequency label for rare/once transits based on how
 * many times it actually occurs in this person's computed lifetime.
 * Self-returns (Saturn Return, Jupiter Return) keep their static label since
 * the ages are already stated there.
 * Common/notable transits keep their static label — a personal count of
 * "7 times in your lifetime" is less useful than "Every 12 years or so".
 */
function resolveFrequency(event, lifetimeCount) {
  const isSelfReturn = event.natalPlanet === event.transitingPlanet
  if (isSelfReturn) return event.frequency
  if (event.rarity !== 'rare' && event.rarity !== 'once') return event.frequency
  if (!lifetimeCount) return event.frequency

  const word = COUNT_WORDS[lifetimeCount - 1] ?? `${lifetimeCount} times`
  const cap  = word.charAt(0).toUpperCase() + word.slice(1)
  return `${cap} in your lifetime`
}

const ASPECT_VERBS = {
  conjunction: 'conjunct',
  opposition:  'opposing',
  square:      'squaring',
}

function ageAt(birthdate, isoDate) {
  const born = new Date(birthdate + 'T12:00:00Z')
  const d    = new Date(isoDate)
  let age = d.getUTCFullYear() - born.getUTCFullYear()
  const m = d.getUTCMonth() - born.getUTCMonth()
  if (m < 0 || (m === 0 && d.getUTCDate() < born.getUTCDate())) age--
  return age
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmtYear(isoDate) {
  return new Date(isoDate).getUTCFullYear()
}

function fmtMonth(isoDate) {
  const d = new Date(isoDate)
  return `${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

const EIGHT_MO_MS    =  8 * 30 * 86_400_000
const EIGHTEEN_MO_MS = 18 * 30 * 86_400_000
const TWO_YEARS_MS   =  2 * 365.25 * 86_400_000

/**
 * Returns { date, through } where:
 *   date    — the primary date label for the card header
 *   through — optional secondary label for present cards ("active through MMM YYYY")
 */
function buildDateLabel(event, timing) {
  const { firstPeakDate, lastPeakDate, orbEnd, rarity } = event
  const now   = Date.now()
  const span  = new Date(lastPeakDate).getTime() - new Date(firstPeakDate).getTime()
  const isShort  = span < EIGHT_MO_MS
  const isLong   = span > EIGHTEEN_MO_MS
  const y1 = fmtYear(firstPeakDate)
  const y2 = fmtYear(lastPeakDate)
  const yearLabel = y1 === y2 ? String(y1) : `${y1}–${y2}`

  if (timing === 'present') {
    const through = orbEnd ? `active through ${fmtMonth(orbEnd)}` : null
    // Short: show the actual month range
    if (isShort) return { date: `${fmtMonth(firstPeakDate)}–${fmtMonth(lastPeakDate)}`, through }
    // Long: year + through
    if (isLong) return { date: yearLabel, through }
    // Medium: peak month + through
    return { date: fmtMonth(firstPeakDate), through }
  }

  // Short transits: always show month range
  if (isShort) {
    const m1 = fmtMonth(firstPeakDate)
    const m2 = fmtMonth(lastPeakDate)
    return { date: m1 === m2 ? m1 : `${m1}–${m2}` }
  }

  // Long transits: year only always
  if (isLong) return { date: yearLabel }

  // Medium — timing-dependent
  if (timing === 'future') {
    const startsIn = new Date(firstPeakDate).getTime() - now
    if (startsIn < TWO_YEARS_MS) return { date: `from ${fmtMonth(firstPeakDate)}` }
  }

  if (timing === 'past' && (rarity === 'rare' || rarity === 'once')) {
    return { date: fmtMonth(firstPeakDate) }
  }

  return { date: yearLabel }
}

function ageRange(birthdate, firstPeak, lastPeak) {
  const a1 = ageAt(birthdate, firstPeak)
  const a2 = ageAt(birthdate, lastPeak)
  return a1 === a2 ? `age ${a1}` : `age ${a1}–${a2}`
}

/**
 * @param {'past'|'present'|'future'} timing
 * @param {object} event — serialized TransitChapter from /api/journey
 * @param {string} birthdate — 'YYYY-MM-DD'
 */
export default function RiverCard({ event, timing, birthdate, lifetimeCount }) {
  const color          = PLANET_COLORS[event.transitingPlanet] ?? '#c9a84c'
  const cardClass      = `journey-card journey-card--${timing}`
  const aspectVerb     = ASPECT_VERBS[event.aspect] ?? event.aspect
  const aspectLabel    = `${event.transitingPlanet} ${aspectVerb} your ${event.natalPlanet}`
  const frequencyLabel = resolveFrequency(event, lifetimeCount)
  const { date, through } = buildDateLabel(event, timing)

  return (
    <div className="journey-event">
      {/* Dot on the timeline line */}
      <div className="journey-event-dot">
        <div
          className="journey-event-dot-inner"
          style={{ borderColor: color, ...(timing !== 'past' && { background: color, opacity: 0.7 }) }}
        />
      </div>

      {/* Card — --planet-color drives the ::before accent bar via CSS */}
      <div className={cardClass} style={{ '--planet-color': color }}>

        {/* Meta row */}
        <div className="journey-card-meta">
          <span className="journey-card-glyph" style={{ color }}>
            {event.transitingGlyph}
          </span>
          <span className="journey-card-date" style={{ color }}>
            {date}
          </span>
          <span className="journey-card-age">
            {ageRange(birthdate, event.firstPeakDate, event.lastPeakDate)}
          </span>
        </div>
        {through && (
          <p className="journey-card-through">{through}</p>
        )}

        {/* Chapter title */}
        <h3 className="journey-card-title">{event.title}</h3>

        {/* Description — tense matches timing */}
        <p className="journey-card-desc">
          {timing === 'past'   ? event.pastDesc   :
           timing === 'future' ? event.futureDesc  :
                                 event.description}
        </p>

        {/* Bottom row: aspect label + rarity badge */}
        <div className="journey-card-footer">
          <p className="journey-card-aspect">{aspectLabel}</p>
          {frequencyLabel && (
            <span className={`journey-card-rarity journey-card-rarity--${event.rarity}`}>
              {frequencyLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
