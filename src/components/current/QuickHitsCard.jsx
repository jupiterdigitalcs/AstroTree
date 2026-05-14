const PLANET_COLORS = {
  Venus: '#c9a84c',
  Mars:  '#cc6655',
}

export default function QuickHitsCard({ quickHits }) {
  if (!quickHits?.length) return null

  return (
    <div className="current-card current-quick">
      <h4 className="current-card-heading">This Week</h4>
      <p className="current-card-whisper">Venus and Mars activations across your group right now</p>
      <ul className="current-quick-list">
        {quickHits.map((hit, i) => {
          const color = PLANET_COLORS[hit.transit.transitingPlanet] ?? 'var(--gold)'
          return (
            <li key={i} className="current-quick-item" style={{ '--accent': color }}>
              <span className="current-quick-dot" />
              <span className="current-quick-text">
                <strong>{hit.memberName}</strong>
                {hit.age != null && hit.age < 13 && <span className="current-age-tag">age {hit.age}</span>}
                {' '}&mdash;{' '}
                {hit.transit.transitingPlanet} {hit.verb} {hit.transit.natalPlanet}
                {hit.blurb && <span className="current-quick-blurb"> &middot; {hit.blurb}</span>}
              </span>
              <span className="current-quick-orb">
                {hit.transit.orb.toFixed(1)}&deg;
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
