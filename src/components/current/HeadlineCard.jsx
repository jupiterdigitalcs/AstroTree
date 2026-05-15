import { NATAL_TARGET_THEMES, getGroupHeadline } from './currentData'

export default function HeadlineCard({ natalTargets, mood, totalMembers }) {
  if (!natalTargets?.length) return null

  const top = natalTargets[0]
  const theme = NATAL_TARGET_THEMES[top.planet]
  const headline = getGroupHeadline(top.planet, mood)
  if (!headline) return null

  return (
    <div className="current-card current-headline">
      <div className="current-headline-glyph">{theme?.glyph ?? '✦'}</div>
      <h3 className="current-headline-title">{headline.title}</h3>
      <p className="current-headline-desc">{headline.desc}</p>
      <p className="current-headline-stat">
        {top.count} transit{top.count !== 1 ? 's' : ''} touching {top.planet.toLowerCase()} across your group
      </p>
    </div>
  )
}
