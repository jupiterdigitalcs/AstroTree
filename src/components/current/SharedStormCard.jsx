import { PLANET_THEMES, NATAL_TARGET_THEMES } from './currentData'

const ASPECT_VERBS = {
  conjunction: 'conjunct',
  opposition:  'opposing',
  square:      'squaring',
}

export default function SharedStormCard({ storm }) {
  const planetTheme = PLANET_THEMES[storm.transitingPlanet]
  const natalTheme  = NATAL_TARGET_THEMES[storm.natalPlanet]
  const color       = planetTheme?.color ?? 'var(--gold)'

  return (
    <div className="current-card current-storm" style={{ '--accent': color }}>
      <h4 className="current-storm-heading">
        <span className="current-storm-glyphs">
          {storm.transitingGlyph} &rarr; {storm.natalGlyph}
        </span>
        <span>
          {storm.transitingPlanet} &times; {storm.natalPlanet}
        </span>
      </h4>
      <p className="current-storm-summary">
        {storm.members.length} members share this transit
        {natalTheme ? ` — ${natalTheme.area.toLowerCase()} is being activated` : ''}
      </p>
      <ul className="current-storm-members">
        {storm.members.map(m => (
          <li key={m.id} className="current-storm-member">
            <span className="current-storm-name">
              {m.name}
              {m.age != null && <span className="current-age-tag">age {m.age}</span>}
            </span>
            <span className="current-storm-aspect">
              {m.aspectSymbol} {ASPECT_VERBS[m.aspect] ?? m.aspect}
            </span>
            <span className="current-storm-orb">
              {m.orb.toFixed(1)}&deg;
              {m.exact && <span className="current-exact-badge">exact</span>}
              {!m.exact && <span className="current-phase">{m.phase}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
