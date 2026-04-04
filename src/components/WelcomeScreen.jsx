import { JupiterIcon } from './JupiterIcon.jsx'

export function WelcomeScreen({ onBegin, onDemo, hasUsedApp, onLoadCharts }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-jd-badge">Jupiter Digital</div>
        <div className="welcome-logo"><JupiterIcon size={72} /></div>
        <h2 className="welcome-title">AstroDig</h2>
        <p className="welcome-tagline">
          {hasUsedApp
            ? <>Welcome back —<br />your charts are waiting</>
            : <>Discover the celestial patterns<br />woven through your family</>}
        </p>

        {/* Desktop CTA */}
        {hasUsedApp ? (
          <button type="button" className="welcome-cta" onClick={onLoadCharts}>
            ✦ Load Saved Chart
          </button>
        ) : (
          <button type="button" className="welcome-cta" onClick={onBegin}>
            Begin Your Tree →
          </button>
        )}

        {/* Secondary desktop action */}
        {hasUsedApp && (
          <button type="button" className="welcome-cta welcome-cta--secondary" onClick={onBegin}>
            + Start a New Chart
          </button>
        )}

        {/* Mobile CTA — primary */}
        <button type="button" className="welcome-cta-mobile" onClick={hasUsedApp ? onLoadCharts : onBegin}>
          {hasUsedApp ? '✦ Load Saved Chart' : '★ Add Family Members'}
        </button>

        {/* Mobile secondary */}
        {hasUsedApp && (
          <button type="button" className="welcome-cta-mobile welcome-cta-mobile--secondary" onClick={onBegin}>
            + Start a New Chart
          </button>
        )}

        <button type="button" className="welcome-demo" onClick={onDemo}>
          or try a demo family
        </button>
      </div>
    </div>
  )
}
