/**
 * Overlay shown when a free-tier user tries to access a premium feature.
 * Displays a lock icon, feature name, and upgrade CTA.
 */
export function LockedOverlay({ feature, description, onUpgrade }) {
  return (
    <div className="locked-overlay">
      <div className="locked-overlay-content">
        <span className="locked-overlay-icon">🔒</span>
        <h3 className="locked-overlay-title">{feature}</h3>
        <p className="locked-overlay-desc">{description}</p>
        <button
          type="button"
          className="locked-overlay-btn"
          onClick={onUpgrade}
        >
          ✦ Unlock with Celestial
        </button>
      </div>
    </div>
  )
}
