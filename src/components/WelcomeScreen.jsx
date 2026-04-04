import { JupiterIcon } from './JupiterIcon.jsx'

export function WelcomeScreen({ onBegin, onDemo }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-jd-badge">Jupiter Digital</div>
        <div className="welcome-logo"><JupiterIcon size={72} /></div>
        <h2 className="welcome-title">AstroDig</h2>
        <p className="welcome-tagline">
          Discover the celestial patterns<br />woven through your family
        </p>
        <button type="button" className="welcome-cta" onClick={onBegin}>
          Begin Your Tree →
        </button>
        <button type="button" className="welcome-cta-mobile" onClick={onBegin}>
          ★ Add Family Members
        </button>
        <button type="button" className="welcome-demo" onClick={onDemo}>
          or try a demo family
        </button>
      </div>
    </div>
  )
}
