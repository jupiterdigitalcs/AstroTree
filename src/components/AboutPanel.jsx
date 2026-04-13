import { JupiterIcon } from './JupiterIcon.jsx'

function IgIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> }
function TikTokIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> }
function XIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> }
function EtsyIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function MailIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }

export default function AboutPanel() {
  return (
    <div className="about-panel">

      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div className="about-brand-block">
        <div className="about-brand-logo"><JupiterIcon size={52} /></div>
        <div>
          <h2 className="about-brand-name">Jupiter Digital</h2>
          <p className="about-brand-tagline">Astrology for modern families</p>
        </div>
      </div>

      {/* ── What is AstroDig ─────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">What is AstroDig?</h3>
        <p className="about-bio">
          AstroDig is a tool to learn astrological connections for your family or group. 
          You can uncover hidden layers beneath the surface and patterns woven through
          your relationships. 
        </p>
      </div>

      {/* ── Bio ───────────────────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">Meet the Astrologer</h3>
        <p className="about-bio">
          Hi, I'm Christina — astrologer and creator behind Jupiter Digital.
          I believe the planets mirror the patterns of our lives, and that
          the signs we share with the people around us reveal something
          real about how we connect. AstroDig is my way of making those
          patterns visible — so you can see your family, friends, and
          partners through a cosmic lens.
        </p>
      </div>

      {/* ── Social links ──────────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">Connect with me</h3>
        <div className="about-links">
          <a href="https://instagram.com/jupreturn" className="about-link" target="_blank" rel="noopener noreferrer">
            <span className="about-link-icon"><IgIcon /></span>
            <span className="about-link-text">
              <span className="about-link-name">Instagram</span>
              <span className="about-link-handle">@jupreturn</span>
            </span>
          </a>
          <a href="https://www.tiktok.com/@jupiterdigital" className="about-link" target="_blank" rel="noopener noreferrer">
            <span className="about-link-icon"><TikTokIcon /></span>
            <span className="about-link-text">
              <span className="about-link-name">TikTok</span>
              <span className="about-link-handle">@jupiterdigital</span>
            </span>
          </a>
          <a href="https://x.com/jupiter_dig" className="about-link" target="_blank" rel="noopener noreferrer">
            <span className="about-link-icon"><XIcon /></span>
            <span className="about-link-text">
              <span className="about-link-name">X</span>
              <span className="about-link-handle">@jupiter_dig</span>
            </span>
          </a>
          <a href="mailto:jupreturns@gmail.com" className="about-link">
            <span className="about-link-icon"><MailIcon /></span>
            <span className="about-link-text">
              <span className="about-link-name">Email</span>
              <span className="about-link-handle">jupreturns@gmail.com</span>
            </span>
          </a>
        </div>
      </div>

      {/* ── Shop ──────────────────────────────────────────────────────── */}
      <a href="https://etsy.com/shop/jupiterdigital" className="about-shop-card" target="_blank" rel="noopener noreferrer">
        <span className="about-shop-icon"><EtsyIcon /></span>
        <span className="about-shop-text">
          <span className="about-shop-name">Jupiter Digital on Etsy</span>
          <span className="about-shop-sub">Astrology prints, birth charts &amp; celestial gifts</span>
        </span>
        <span className="about-shop-arrow">→</span>
      </a>

      {/* ── Events ─────────────────────────────────────────────────────── */}
      <a href="https://jupiterdigitalevents.com" className="about-shop-card" target="_blank" rel="noopener noreferrer">
        <span className="about-shop-icon">✦</span>
        <span className="about-shop-text">
          <span className="about-shop-name">Jupiter Digital Events</span>
          <span className="about-shop-sub">Astrology parties, booths &amp; celestial events</span>
        </span>
        <span className="about-shop-arrow">→</span>
      </a>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">How It Works — The Astrology</h3>
        <p className="about-bio">
          AstroDig uses birth dates to calculate planetary placements for each person. Here's what each planet actually tells us:
        </p>
        <div className="about-howit-list">
          <div className="about-howit-item">
            <span className="about-howit-glyph">☀</span>
            <div>
              <strong>Sun Sign</strong> — your core identity, the version of yourself that shows up most naturally. The sign most people know ("I'm a Scorpio").
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">☽</span>
            <div>
              <strong>Moon Sign</strong> — your emotional inner world. How you feel, react, and what you need to feel safe. Requires birth date only — no time needed.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">☿</span>
            <div>
              <strong>Mercury</strong> — how you think and communicate. Quick or deliberate? Detail-focused or big-picture? Two people with the same Mercury understand each other's logic instantly.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">♀</span>
            <div>
              <strong>Venus</strong> — how you love and what you value. Your relationship style, what you're drawn to, and how you express affection.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">♂</span>
            <div>
              <strong>Mars</strong> — your drive and how you act on it. Your energy, ambition, and how you handle conflict or desire.
            </div>
          </div>
        </div>
        <p className="about-bio" style={{ marginTop: '0.75rem' }}>
          Each sign belongs to an <strong>element</strong> (Fire, Earth, Air, Water) and a <strong>modality</strong> (Cardinal, Fixed, Mutable), which is how AstroDig spots patterns across a whole group. <strong>Compatibility</strong> scores how many of these placements two people share — the more align, the deeper the bond.
        </p>
      </div>

      {/* ── Your Data & Privacy ───────────────────────────────────────── */}
      <div className="about-card" id="about-data">
        <h3 className="about-heading">Your Data &amp; Privacy</h3>
        <p className="about-bio">
          AstroDig saves your charts locally in your browser and syncs them to our servers when you sign in.
          Sign in with Google to access your charts and any purchases (like Celestial) on any device.
        </p>

        <p className="about-data-subhead">What we collect</p>
        <ul className="about-data-list">
          <li>Chart data (names, birthdates, astrological signs)</li>
          <li>Your Google account email when you sign in</li>
          <li>Basic device info for chart syncing</li>
        </ul>

        <p className="about-data-subhead">How we use it</p>
        <ul className="about-data-list">
          <li>To sync and store your charts across devices</li>
          <li>To link purchases (Celestial) to your account</li>
          <li>To send purchase confirmations and occasional updates from Jupiter Digital</li>
        </ul>

        <p className="about-data-subhead">What we don't do</p>
        <ul className="about-data-list">
          <li>Sell your data or share it with third parties</li>
        </ul>

        <p className="about-bio" style={{ marginTop: '0.5rem' }}>
          You can delete individual charts from the Saved tab, or request full data removal by
          contacting us at <a className="about-inline-link" href="mailto:jupreturns@gmail.com">jupreturns@gmail.com</a>.
          To disconnect your account, sign out from the Saved tab.
          This app is not intended for children under 13.
        </p>
      </div>

      {/* ── App note ──────────────────────────────────────────────────── */}
      <p className="about-app-note">
        If AstroDig brings you joy, a site, social, or shop visit
        means the world. ✨
      </p>

    </div>
  )
}
