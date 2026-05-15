import { PLANET_THEMES, NATAL_TARGET_THEMES } from './currentData'

export default function SharedStormCard({ storm }) {
  const planetTheme = PLANET_THEMES[storm.transitingPlanet]
  const natalTheme  = NATAL_TARGET_THEMES[storm.natalPlanet]
  const color       = planetTheme?.color ?? 'var(--gold)'

  return (
    <div className="current-card current-storm" style={{ '--accent': color }}>
      <h4 className="current-storm-heading">
        <span className="current-storm-glyphs">
          {storm.transitingGlyph} {storm.natalGlyph}
        </span>
        <span>
          {storm.transitingPlanet} touching {storm.natalPlanet}
        </span>
      </h4>
      <p className="current-storm-summary">
        {storm.members.length} members are feeling this right now
        {natalTheme ? `. It connects to ${natalTheme.area.toLowerCase()}` : ''}
      </p>
      <ul className="current-storm-members">
        {storm.members.map(m => (
          <li key={m.id} className="current-storm-member">
            <span className="current-storm-name">
              {m.name}
              {m.age != null && <span className="current-age-tag">age {m.age}</span>}
            </span>
            {m.exact && <span className="current-exact-badge">exact</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
