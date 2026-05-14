const MOON_IMPACT = {
  Jupiter:  { vibe: 'easy',   note: 'Happy, growing, easy days. Extra smiles and appetite.' },
  Venus:    { vibe: 'easy',   note: 'Calm, cuddly, content. Good days for bonding.' },
  Saturn:   { vibe: 'heavy',  note: 'Clingy, fussy, needs more comfort. Extra patience helps.' },
  Mars:     { vibe: 'spicy',  note: 'Restless, irritable, disrupted sleep. The whole house feels it.' },
  Uranus:   { vibe: 'wild',   note: 'Unpredictable moods and schedule changes. Expect the unexpected.' },
  Neptune:  { vibe: 'dreamy', note: 'Spacey, extra sleepy, or unusually sensitive. Go with the flow.' },
  Pluto:    { vibe: 'intense',note: 'Deep, heavy moods. Big feelings in a small body.' },
}

const MOON_MOOD_NOW = {
  conjunction: { label: 'Moon return', note: 'The Moon is home. Peak emotional reset, comfort, and familiarity.' },
  opposition:  { label: 'Moon opposite', note: 'Emotional tension. May feel off, reactive, or extra needy.' },
  square:      { label: 'Moon square', note: 'Friction and fussiness. Routines may not land like they usually do.' },
  trine:       { label: 'Moon trine', note: 'Easy flow. Content and settled, good energy for the whole house.' },
}

const VIBE_COLORS = {
  easy:   '#c9a84c',
  heavy:  '#8899cc',
  spicy:  '#cc6655',
  wild:   '#56c8c0',
  dreamy: '#7bafd4',
  intense:'#b06cbf',
}

const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fmtShortDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  return `${DAY_NAMES[d.getUTCDay()]} ${MONTH_ABBR[d.getUTCMonth()]} ${d.getUTCDate()}`
}

export default function BabyMoodsCard({ babyMoods }) {
  if (!babyMoods?.length) return null

  return (
    <div className="current-card current-baby">
      <h4 className="current-card-heading">The Littlest Ones</h4>
      <p className="current-card-whisper">
        Babies and toddlers live through their Moon. When something crosses it, the whole group feels it.
        The Moon return (every ~27 days) is a reset point, like a mini emotional cycle. Expect familiar moods and patterns to resurface.
      </p>
      {babyMoods.map(baby => {
        const moodNow = baby.moonMoodNow ? MOON_MOOD_NOW[baby.moonMoodNow] : null
        return (
          <div key={baby.id} className="current-baby-member">
            <p className="current-baby-name">
              <strong>{baby.name}</strong>
              <span className="current-age-tag">age {baby.age < 1 ? '<1' : baby.age}</span>
            </p>

            {/* Current transiting Moon mood */}
            {moodNow && (
              <div className="current-baby-transit" style={{ '--accent': '#c9a84c' }}>
                <span className="current-baby-dot" />
                <span className="current-baby-text">
                  <strong>{moodNow.label}</strong> (Moon in {baby.transitMoonSign})
                  {' '}&mdash; {moodNow.note}
                </span>
              </div>
            )}

            {/* Slower planet transits to natal Moon */}
            {baby.transits.map((t, i) => {
              const impact = MOON_IMPACT[t.transitingPlanet]
              const color = VIBE_COLORS[impact?.vibe] ?? 'var(--gold)'
              return (
                <div key={i} className="current-baby-transit" style={{ '--accent': color }}>
                  <span className="current-baby-dot" />
                  <span className="current-baby-text">
                    {t.transitingPlanet} {t.aspectSymbol} Moon
                    {impact && <> &mdash; {impact.note}</>}
                  </span>
                </div>
              )
            })}

            {/* No transits and no mood = calm note */}
            {!moodNow && baby.transits.length === 0 && (
              <p className="current-baby-calm">
                {baby.hasBirthTime
                  ? 'Clear skies for now. Steady mood expected.'
                  : 'Add birth time for Moon-specific insights.'}
              </p>
            )}

            {/* Look-ahead: next Moon return */}
            {baby.moonReturn && (
              <p className="current-baby-ahead">
                Next Moon return: ~{fmtShortDate(baby.moonReturn)}
                {baby.natalMoonSign && <> (Moon in {baby.natalMoonSign})</>}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
