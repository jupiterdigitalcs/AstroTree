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
          <p className="about-brand-tagline">Cosmic Connections</p>
        </div>
      </div>

      {/* ── What is AstroDig ─────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">What is AstroDig?</h3>
        <p className="about-bio">
          AstroDig is a tool to explore the astrological connections between the people in your life.
          Add your family, friends, or coworkers and see what the stars say about how you all connect.
        </p>
      </div>

      {/* ── Bio ───────────────────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">Meet the Astrologer</h3>
        <p className="about-bio">
          Hi, I'm Christina, astrologer and creator behind Jupiter Digital.
          I believe the planets mirror the patterns of our lives, and that
          the signs we share with the people around us reveal something
          real about how we connect. AstroDig is my way of making those
          patterns visible so you can see your family, friends, and
          partners through a cosmic lens.
        </p>
      </div>

      {/* ── App note ──────────────────────────────────────────────────── */}
      <p className="about-app-note">
        Enjoying AstroDig? Follow us on social or visit the shop. It means the world.
      </p>

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
        <h3 className="about-heading">How It Works</h3>
        <p className="about-bio">
          Astrology is the study of how the planets mirror human behavior on earth. The planets aren't doing anything "to you." They reflect patterns, and it's up to you what you do with that awareness. You are way more than just your sun sign!
        </p>
        <p className="about-bio" style={{ marginTop: '0.5rem' }}>
          AstroDig uses birth dates to calculate planetary placements for each person. Here's what each planet represents:
        </p>
        <div className="about-howit-list">
          <div className="about-howit-item">
            <span className="about-howit-glyph">☀</span>
            <div>
              <strong>Sun</strong> — direction, purpose, ego, identity. The sign most people know ("I'm a Scorpio"), but only one piece of the full picture.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">☽</span>
            <div>
              <strong>Moon</strong> — emotions, body, inner world. How you feel, react, and what you need to feel safe. Requires birth date only, no time needed.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">☿</span>
            <div>
              <strong>Mercury</strong> — communication, mind, thinking. Quick or deliberate? Detail-focused or big-picture? Two people with the same Mercury understand each other's logic instantly.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">♀</span>
            <div>
              <strong>Venus</strong> — love, values, finances, beauty. Your relationship style, what you're drawn to, and how you express affection.
            </div>
          </div>
          <div className="about-howit-item">
            <span className="about-howit-glyph">♂</span>
            <div>
              <strong>Mars</strong> — actions, physical energy, drive. How you go after what you want and how you handle conflict.
            </div>
          </div>
        </div>
        <p className="about-bio" style={{ marginTop: '0.75rem' }}>
          Each sign belongs to an <strong>element</strong> (Fire, Earth, Air, Water) and a <strong>modality</strong> (Cardinal, Fixed, Mutable), which is how AstroDig spots patterns across a whole group. When two people share placements, it often shows up as a natural understanding between them.
        </p>
        <p className="about-bio" style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Note that humans have free will and choice. Astrology provides awareness of the energy present and how it might manifest. It is up to you what you do with those energies.
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
          <li>To study anonymized, aggregated astrological patterns across families (e.g. how often family members share moon signs). No individual names, birthdates, or identifying details are ever published — only statistical trends across all users combined.</li>
        </ul>

        <p className="about-data-subhead">What we don't do</p>
        <ul className="about-data-list">
          <li>Sell your data or share it with third parties</li>
          <li>Publish or share any individual chart data, names, or birthdates — research uses only anonymous aggregate patterns</li>
        </ul>

        <p className="about-data-subhead">Adding other people</p>
        <p className="about-bio">
          AstroDig lets you enter birth information for people in your life. By doing so, you acknowledge that this information is shared with you personally and that you are entering it at your own discretion. We encourage you to get permission from the people you add when possible. Jupiter Digital LLC does not verify consent between users and is not responsible for information entered on behalf of others.
        </p>

        <p className="about-bio" style={{ marginTop: '0.5rem' }}>
          You can delete individual charts from the Saved tab, or request full data removal by
          contacting us at <a className="about-inline-link" href="mailto:jupreturns@gmail.com">jupreturns@gmail.com</a>.
          To disconnect your account, sign out from the Saved tab.
          This app is not intended for children under 13.
        </p>
      </div>

      {/* ── Terms of Service ─────────────────────────────────────────── */}
      <div className="about-card" id="about-terms">
        <h3 className="about-heading">Terms of Service</h3>
        <p className="about-bio">
          By using AstroDig, you agree to the following terms. If you do not agree, please do not use the app.
        </p>

        <p className="about-data-subhead">Ownership &amp; Intellectual Property</p>
        <p className="about-bio">
          AstroDig, including its design, code, branding, content, and all related materials, is the intellectual property of Jupiter Digital LLC. You may not copy, reproduce, redistribute, reverse-engineer, or create derivative works from any part of AstroDig without written permission.
        </p>

        <p className="about-data-subhead">User Content</p>
        <p className="about-bio">
          You retain ownership of the data you enter (names, birthdates, etc.). By using AstroDig, you grant Jupiter Digital LLC a limited license to store, process, and display your data to provide the service and to analyze anonymized, aggregated patterns for astrological research. We do not claim ownership of your chart data, and research never includes individual names, birthdates, or any information that could identify you or the people in your charts.
        </p>

        <p className="about-data-subhead">Purchases &amp; Refunds</p>
        <p className="about-bio">
          Celestial is a one-time digital purchase. All sales are final. If you experience a technical issue preventing access to features you've paid for, contact us at <a className="about-inline-link" href="mailto:jupreturns@gmail.com">jupreturns@gmail.com</a> and we'll make it right.
        </p>

        <p className="about-data-subhead">Astrology Disclaimer</p>
        <p className="about-bio">
          AstroDig is for entertainment and personal reflection. Everything shared is based on ancient astrological practice combined with general interpretations. It is not professional advice of any kind. A birth chart is a starting point, not the whole story.
        </p>

        <p className="about-data-subhead">Limitation of Liability</p>
        <p className="about-bio">
          AstroDig is provided "as is" without warranties of any kind. Jupiter Digital LLC is not liable for any damages arising from your use of the app, including loss of data, interruption of service, or reliance on astrological content.
        </p>

        <p className="about-bio" style={{ marginTop: '0.5rem', fontSize: '0.68rem', color: 'var(--text-dim)' }}>
          These terms are governed by the laws of the United States. Jupiter Digital LLC reserves the right to update these terms at any time. Continued use of AstroDig constitutes acceptance of any changes.
        </p>
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <p className="about-disclaimer">
        Everything shared is based on ancient astrological practice. Jupiter Digital provides astrology content for entertainment and personal reflection and assumes no liability for actions taken based on the information provided.
      </p>

    </div>
  )
}
