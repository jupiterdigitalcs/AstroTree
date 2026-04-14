import { canAccess } from '../utils/entitlements.js'

export function FloatingPills({ treeView, setTreeView, entitlements }) {
  const isPremium = entitlements?.tier === 'premium'
  const views = [
    { key: 'tree', label: '🌳 Tree' },
    { key: 'constellation', label: '✦ Constellation' },
    { key: 'zodiac', label: '☉ Zodiac', feature: 'zodiac_view' },
    { key: 'tables', label: '☽ Tables', feature: 'tables_view' },
  ]

  return (
    <div className="cosmic-floating-pills">
      {views.map(v => {
        const locked = v.feature && !canAccess(v.feature, entitlements?.tier, entitlements?.config)
        return (
          <button
            key={v.key}
            type="button"
            className={`cosmic-pill-btn${treeView === v.key ? ' active' : ''}`}
            onClick={() => setTreeView(v.key)}
          >
            {v.label}
            {v.feature && isPremium && <span className="pro-tag pro-tag--subtle">✦</span>}
            {locked && <span className="cosmic-pill-lock">🔒</span>}
          </button>
        )
      })}
    </div>
  )
}
