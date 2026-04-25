import { useState, useEffect, useRef } from 'react'
import { JupiterIcon } from './JupiterIcon.jsx'
import { DateInput } from './DateInput.jsx'
import { logEvent } from '../utils/cloudStorage.js'
import { getDeviceId } from '../utils/identity.js'

export function CanvasOnboarding({ onAdd, onDemo, onDemoCrew, onLoadCharts, onNewChart, hasUsedApp }) {
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const hasLogged = useRef(false)
  const tookAction = useRef(false)

  // Track that the onboarding screen was seen + bounce detection
  useEffect(() => {
    if (hasLogged.current) return
    hasLogged.current = true
    logEvent(hasUsedApp ? 'onboarding_seen_returning' : 'onboarding_seen')

    // Fire beacon on page unload if user never took action
    function handleUnload() {
      if (tookAction.current) return
      const deviceId = getDeviceId()
      if (!deviceId) return
      const body = JSON.stringify({ deviceId, eventName: 'onboarding_bounce' })
      navigator.sendBeacon('/api/device?action=event', body)
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e) {
    e.preventDefault()
    tookAction.current = true
    if (!name.trim() || !birthdate) {
      onNewChart()
      return
    }
    onAdd({
      members: [{ name: name.trim(), birthdate, birthTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone }],
    })
  }

  if (hasUsedApp) {
    return (
      <div className="cosmic-onboarding">
        <div className="cosmic-onboarding-brand">
          <JupiterIcon size={36} />
          <span className="cosmic-onboarding-brand-name">AstroDig</span>
          <span className="cosmic-onboarding-brand-by">by Jupiter Digital</span>
        </div>
        <h2>Welcome Back</h2>
        <p>Your charts are waiting — pick up where you left off.</p>
        <button type="button" className="cosmic-onboarding-btn" onClick={() => { tookAction.current = true; onLoadCharts() }}>
          Load Saved Chart
        </button>
        <button type="button" className="cosmic-onboarding-skip" onClick={() => { tookAction.current = true; onNewChart() }}>
          + Start a New Chart
        </button>
      </div>
    )
  }

  const trimmedName = name.trim()
  const canSubmit = trimmedName && birthdate

  return (
    <div className="cosmic-onboarding cosmic-onboarding--hero">
      {/* ── Brand ── */}
      <div className="cosmic-onboarding-brand">
        <JupiterIcon size={36} />
        <span className="cosmic-onboarding-brand-name">AstroDig</span>
        <span className="cosmic-onboarding-brand-by">by Jupiter Digital</span>
      </div>

      {/* ── Headline ── */}
      <h2>Map your people's cosmic&nbsp;DNA</h2>
      <p className="cosmic-onboarding-tagline">
        See the sun signs, moon signs, and planets across your family, friends, or crew — all in one&nbsp;chart.
      </p>

      {/* ── Mini preview: tree + insight ── */}
      <div className="onboarding-preview-row" aria-hidden="true">
        {/* Mini tree: parents at top, child below */}
        <div className="onboarding-mini-tree">
          <svg className="onboarding-mini-lines" viewBox="0 0 120 72" fill="none">
            {/* Spouse line: horizontal between Mom and Dad */}
            <path d="M46 10 L74 10" stroke="#d4a0bc" strokeWidth="1" strokeOpacity="0.45" strokeDasharray="4 3" className="onboarding-mini-line" />
            {/* Parent-child line: midpoint down to You */}
            <path d="M60 10 L60 56" stroke="#c9a84c" strokeWidth="1.2" strokeOpacity="0.5" className="onboarding-mini-line onboarding-mini-line--2" />
          </svg>
          <div className="onboarding-mini-node onboarding-mini-node--tl" style={{ '--el': '#e8634a' }}>
            <span className="onboarding-mini-glyph">♈</span>
            <span className="onboarding-mini-name">Mom</span>
          </div>
          <div className="onboarding-mini-node onboarding-mini-node--tr" style={{ '--el': '#6b8dd6' }}>
            <span className="onboarding-mini-glyph">♏</span>
            <span className="onboarding-mini-name">Dad</span>
          </div>
          <div className="onboarding-mini-node onboarding-mini-node--bc" style={{ '--el': '#5bc8f5' }}>
            <span className="onboarding-mini-glyph">♊</span>
            <span className="onboarding-mini-name">You</span>
          </div>
        </div>

        {/* Mini insight card */}
        <div className="onboarding-mini-insight">
          <span className="onboarding-mini-insight-heading">Family Signature</span>
          <span className="onboarding-mini-insight-body">Your family is <strong>Fire + Water</strong> dominant — passion meets intuition</span>
        </div>
      </div>

      {/* ── Inline form ── */}
      <form className="cosmic-onboarding-form" onSubmit={handleSubmit}>
        <div className="cosmic-onboarding-row">
          <label className="cosmic-onboarding-label">
            <span className="cosmic-onboarding-label-text">Name</span>
            <input
              type="text"
              className="cosmic-onboarding-input"
              placeholder="e.g. Alex Rivera"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label className="cosmic-onboarding-label">
            <span className="cosmic-onboarding-label-text">Birthday</span>
            <DateInput
              value={birthdate}
              onChange={setBirthdate}
            />
          </label>
        </div>
        <button
          type="submit"
          className="cosmic-onboarding-btn"
        >
          {canSubmit ? `Start ${trimmedName}'s Chart` : 'Start My Chart'}
        </button>
      </form>

      {/* ── Divider ── */}
      <div className="cosmic-onboarding-divider"><span>or try an example</span></div>

      {/* ── Demo links ── */}
      <div className="cosmic-onboarding-demos cosmic-onboarding-demos--primary">
        <button type="button" className="cosmic-onboarding-demo-primary" onClick={() => { tookAction.current = true; onDemo() }}>
          Family Tree
        </button>
        <button type="button" className="cosmic-onboarding-demo-primary" onClick={() => { tookAction.current = true; onDemoCrew() }}>
          Friend Group
        </button>
      </div>
    </div>
  )
}
