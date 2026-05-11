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

function fmtYear(isoDate) {
  return new Date(isoDate).getUTCFullYear()
}

function dateRange(firstPeak, lastPeak) {
  const y1 = fmtYear(firstPeak)
  const y2 = fmtYear(lastPeak)
  return y1 === y2 ? String(y1) : `${y1}–${y2}`
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
  const color        = PLANET_COLORS[event.transitingPlanet] ?? '#c9a84c'
  const cardClass    = `journey-card journey-card--${timing}`
  const aspectVerb   = ASPECT_VERBS[event.aspect] ?? event.aspect
  const aspectLabel  = `${event.transitingPlanet} ${aspectVerb} your ${event.natalPlanet}`
  const frequencyLabel = resolveFrequency(event, lifetimeCount)

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
            {dateRange(event.firstPeakDate, event.lastPeakDate)}
          </span>
          <span className="journey-card-age">
            {ageRange(birthdate, event.firstPeakDate, event.lastPeakDate)}
          </span>
        </div>

        {/* Chapter title */}
        <h3 className="journey-card-title">{event.title}</h3>

        {/* Description */}
        <p className="journey-card-desc">{event.description}</p>

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
