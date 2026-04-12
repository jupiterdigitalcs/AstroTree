import { JupiterIcon } from './JupiterIcon.jsx'

export function WelcomeScreen({ onBegin, onDemo, onDemoCrew, hasUsedApp, onLoadCharts }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-jd-badge">Jupiter Digital</div>
        <div className="welcome-logo"><JupiterIcon size={72} /></div>
        <h2 className="welcome-title">AstroDig</h2>
        <p className="welcome-tagline">
          {hasUsedApp
            ? <>Welcome back —<br />your charts are waiting</>
            : <>See how the stars connect<br />the people in your life</>}
        </p>
        {!hasUsedApp && (
          <p className="welcome-subtitle">
            Map sun signs, moon signs, elements, and compatibility across your family, friends, and coworkers.
          </p>
        )}

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

        {/* Mobile CTA — primary (above bullets so it's always visible) */}
        <button type="button" className="welcome-cta-mobile" onClick={hasUsedApp ? onLoadCharts : onBegin}>
          {hasUsedApp ? '✦ Load Saved Chart' : '★ Start Your Chart'}
        </button>

        {/* Mobile secondary */}
        {hasUsedApp && (
          <button type="button" className="welcome-cta-mobile welcome-cta-mobile--secondary" onClick={onBegin}>
            + Start a New Chart
          </button>
        )}

        {!hasUsedApp && (
          <div className="welcome-steps">
            <div className="welcome-step">
              <span className="welcome-step-icon">☉</span>
              <span>Enter a birthdate — sun sign appears automatically</span>
            </div>
            <div className="welcome-step">
              <span className="welcome-step-icon">♒</span>
              <span>See shared signs, element patterns, and compatibility</span>
            </div>
            <div className="welcome-step">
              <span className="welcome-step-icon">✦</span>
              <span>Add a few now, come back later — it saves as you go</span>
            </div>
          </div>
        )}

        <div className="welcome-demo-row">
          <span className="welcome-demo-label">or see it in action:</span>
          <button type="button" className="welcome-demo" onClick={onDemo}>
            Family Tree
          </button>
          <button type="button" className="welcome-demo" onClick={onDemoCrew}>
            Friends &amp; Coworkers
          </button>
        </div>
      </div>
    </div>
  )
}
