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
    if (!name.trim() || !birthdate) return
    tookAction.current = true
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

      {/* ── Zodiac glyphs strip ── */}
      <div className="cosmic-onboarding-glyphs" aria-hidden="true">
        ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓
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
          disabled={!canSubmit}
        >
          {canSubmit ? `Add ${trimmedName} to Chart` : 'Add to Chart'}
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
