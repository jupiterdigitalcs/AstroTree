import { PLANET_THEMES } from './currentData'

export default function HeadlineCard({ dominantPlanet }) {
  if (!dominantPlanet) return null

  const theme = PLANET_THEMES[dominantPlanet.planet]
  if (!theme) return null

  return (
    <div className="current-card current-headline" style={{ '--accent': theme.color }}>
      <div className="current-headline-glyph">{theme.glyph}</div>
      <h3 className="current-headline-title">{theme.season}</h3>
      <p className="current-headline-theme">{theme.theme}</p>
      <p className="current-headline-desc">{theme.description}</p>
      <p className="current-headline-stat">
        Touching <strong>{dominantPlanet.memberCount}</strong> of{' '}
        <strong>{dominantPlanet.totalMembers}</strong> members
        {' '}&middot;{' '}
        {dominantPlanet.transitCount} active transit{dominantPlanet.transitCount !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
