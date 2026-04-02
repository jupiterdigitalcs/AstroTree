import { useState } from 'react'
import { JupiterIcon } from './JupiterIcon.jsx'
import { getSavedEmail } from './EmailCapture.jsx'

function IgIcon()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> }
function TikTokIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/></svg> }
function XIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> }
function EtsyIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> }
function MailIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }

export default function AboutPanel() {
  const [savedEmail,       setSavedEmail]       = useState(() => getSavedEmail())
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  function handleRemoveEmail() {
    try {
      localStorage.removeItem('astrotree_user_email')
      localStorage.removeItem('astrotree_email_asked')
    } catch {}
    setSavedEmail(null)
    setShowRemoveConfirm(false)
  }

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

      {/* ── Bio ───────────────────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">Meet the Astrologer</h3>
        <p className="about-bio">
          Hi, I'm Christina — astrologer and creator behind Jupiter Digital.
          I believe the stars hold a mirror to the patterns passed down through
          our families. AstroTree is my way of making that visible.
        </p>
      </div>

      {/* ── Social links ──────────────────────────────────────────────── */}
      <div className="about-card">
        <h3 className="about-heading">Find me online</h3>
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

      {/* ── Your Data ─────────────────────────────────────────────────── */}
      <div className="about-card" id="about-data">
        <h3 className="about-heading">Your Data</h3>
        <p className="about-bio">
          AstroTree saves your family tree to your browser. If you use cloud sync,
          your tree data (names, birthdates, and astrological signs) is also stored
          on our servers so you can access it from other devices.
        </p>
        <ul className="about-data-list">
          <li>No name, email, or account is required.</li>
          <li>Each browser gets a random anonymous ID — not tied to you personally.</li>
          <li>You can delete your trees at any time from Saved Trees.</li>
          <li>Trees shared via link are visible to anyone with that link.</li>
        </ul>
        <p className="about-bio" style={{ marginTop: '0.5rem' }}>
          This is a small independent app. Your data is not sold or used for advertising.
        </p>

        {savedEmail && !showRemoveConfirm && (
          <div className="about-email-row">
            <span className="about-email-label">Saved email: <strong>{savedEmail}</strong></span>
            <button type="button" className="about-remove-email-btn" onClick={() => setShowRemoveConfirm(true)}>
              Remove
            </button>
          </div>
        )}

        {showRemoveConfirm && (
          <div className="about-remove-confirm">
            <p className="about-remove-warning">
              ⚠ This removes your email from this device. Your trees stay saved locally, but <strong>cloud sync and backup will stop</strong> until you re-enter an email. This doesn't delete your trees from the server.
            </p>
            <div className="about-remove-actions">
              <button type="button" className="about-remove-cancel" onClick={() => setShowRemoveConfirm(false)}>Cancel</button>
              <button type="button" className="about-remove-confirm-btn" onClick={handleRemoveEmail}>Remove email</button>
            </div>
          </div>
        )}
      </div>

      {/* ── App note ──────────────────────────────────────────────────── */}
      <p className="about-app-note">
        AstroTree is a free tool — if it brings you joy,
        a shop visit means the world. ✨
      </p>

    </div>
  )
}
