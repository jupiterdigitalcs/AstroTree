import { NATAL_TARGET_THEMES } from './currentData'

export default function NatalTargetCard({ natalTargets }) {
  if (!natalTargets?.length) return null

  const top = natalTargets[0]
  const topTheme = NATAL_TARGET_THEMES[top.planet]

  return (
    <div className="current-card current-targets">
      <h4 className="current-card-heading">Where It's Landing</h4>
      <p className="current-card-note">
        Most transits are hitting <strong>{top.planet}</strong>
        {topTheme ? ` — ${topTheme.area.toLowerCase()}` : ''}
      </p>
      <div className="current-target-bars">
        {natalTargets.map(t => {
          const theme = NATAL_TARGET_THEMES[t.planet]
          const maxCount = natalTargets[0].count
          const pct = Math.round((t.count / maxCount) * 100)
          return (
            <div key={t.planet} className="current-target-row">
              <span className="current-target-label">
                {t.glyph} {t.planet}
              </span>
              <div className="current-target-bar-track">
                <div
                  className="current-target-bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="current-target-count">{t.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
