import { useState, useEffect, useRef } from 'react'
import { JupiterIcon } from './JupiterIcon.jsx'
import { DateInput } from './DateInput.jsx'
import { logEvent } from '../utils/cloudStorage.js'
import { getDeviceId } from '../utils/identity.js'
import { getSunSign, getElement } from '../utils/astrology.js'
import { getMoonTonight } from '../utils/moonTonight.js'
import { loadCharts } from '../utils/storage.js'
import { formatRelativeTime } from '../utils/format.js'
import { kv } from '../utils/kvStore.js'

// Rotating preview lines shown before the visitor starts typing — phrased
// about other people (never "you"/"your") so they can't read as claims
const PREVIEW_INSIGHTS = [
  { heading: 'Family Signature', body: <>A family that runs <strong>Fire + Water</strong>. Passion meets intuition.</> },
  { heading: 'Shared Moons', body: <>Three cousins, one <strong>Cancer moon</strong>. The same emotional language.</> },
  { heading: 'Hidden Connections', body: <>Her Venus on his Sun, <strong>warmth that runs both ways</strong></> },
]

function MoonGlyph({ illumination, waxing, size = 14 }) {
  // Lit fraction rendered as an offset overlay disc — approximate but readable at 14px
  const r = size / 2
  const shift = (1 - illumination) * size * (waxing ? 1 : -1)
  return (
    <svg className="onboarding-moon-glyph" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <clipPath id="moon-disc"><circle cx={r} cy={r} r={r - 0.5} /></clipPath>
      </defs>
      <circle cx={r} cy={r} r={r - 0.5} fill="rgba(237,230,255,0.12)" />
      <circle cx={r + shift} cy={r} r={r - 0.5} fill="#e6c76e" clipPath="url(#moon-disc)" />
    </svg>
  )
}

function MoonTonight() {
  const [moon, setMoon] = useState(null)
  useEffect(() => {
    let alive = true
    getMoonTonight().then(m => { if (alive) setMoon(m) })
    return () => { alive = false }
  }, [])
  if (!moon) return null
  return (
    <p className="onboarding-moon">
      <MoonGlyph illumination={moon.illumination} waxing={moon.waxing} />
      <span>Tonight: {moon.name}{moon.moonSign ? ` in ${moon.moonSign}` : ''}</span>
    </p>
  )
}

export function CanvasOnboarding({ onAdd, onDemo, onDemoCrew, onLoadCharts, onLoadChart, onNewChart, hasUsedApp }) {
  const [name, setName] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [showWhatIs, setShowWhatIs] = useState(false)
  const [previewIdx, setPreviewIdx] = useState(0)
  const [campaign, setCampaign] = useState(null)
  const hasLogged = useRef(false)
  const tookAction = useRef(false)
  const revealLogged = useRef(false)

  // Track that the onboarding screen was seen + bounce detection
  useEffect(() => {
    if (hasLogged.current) return
    hasLogged.current = true
    logEvent(hasUsedApp ? 'onboarding_seen_returning' : 'onboarding_seen')

    // Campaign arrivals (e.g. astrodig.com/uac → ?utm_campaign=uac2026).
    // The param disappears on navigation, so persist it; log only fresh
    // arrivals so the event counts scans, not revisits.
    try {
      const param = new URLSearchParams(window.location.search).get('utm_campaign')
      if (param) {
        kv.set('astrotree_campaign', param)
        if (param === 'uac2026') logEvent('uac_landing')
      }
      const c = param || kv.get('astrotree_campaign')
      if (c) setCampaign(c)
    } catch {}

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

  // The instant payoff: their sun sign, live, as soon as the birthday is typed
  const sun = birthdate ? getSunSign(birthdate) : null
  const el = sun ? getElement(sun.sign) : null

  useEffect(() => {
    if (sun && !revealLogged.current) {
      revealLogged.current = true
      logEvent('onboarding_sign_revealed')
    }
  }, [sun])

  // Rotate example insights only while the card is idle — the moment the
  // visitor starts typing, examples stop (they read as claims otherwise)
  const engaged = name.trim().length > 0 || !!birthdate
  useEffect(() => {
    if (engaged) return
    const t = setInterval(() => setPreviewIdx(i => (i + 1) % PREVIEW_INSIGHTS.length), 4200)
    return () => clearInterval(t)
  }, [engaged])

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
    const charts = loadCharts()
      .slice()
      .sort((a, b) => new Date(b.savedAt ?? 0) - new Date(a.savedAt ?? 0))
      .slice(0, 3)
    return (
      <div className="cosmic-onboarding">
        <div className="cosmic-onboarding-brand">
          <JupiterIcon size={36} />
          <span className="cosmic-onboarding-brand-name">AstroDig</span>
          <span className="cosmic-onboarding-brand-by">by Jupiter Digital</span>
        </div>
        <h2>Welcome Back</h2>
        <p>Your charts are waiting. Pick up where you left off.</p>
        {charts.length > 0 && (
          <div className="onboarding-chart-list">
            {charts.map(c => (
              <button
                key={c.id}
                type="button"
                className="onboarding-chart-row"
                onClick={() => { tookAction.current = true; onLoadChart?.(c) }}
              >
                <span className="onboarding-chart-row-title">{c.title || 'Untitled Chart'}</span>
                <span className="onboarding-chart-row-meta">
                  {c.nodes?.length ?? 0} {(c.nodes?.length ?? 0) === 1 ? 'person' : 'people'}
                  {c.savedAt ? ` · ${formatRelativeTime(new Date(c.savedAt))}` : ''}
                </span>
              </button>
            ))}
          </div>
        )}
        <button type="button" className="cosmic-onboarding-btn" onClick={() => { tookAction.current = true; onLoadCharts() }}>
          {charts.length > 0 ? 'All Saved Charts' : 'Load Saved Chart'}
        </button>
        <button type="button" className="cosmic-onboarding-skip" onClick={() => { tookAction.current = true; onNewChart() }}>
          + Start a New Chart
        </button>
        <MoonTonight />
      </div>
    )
  }

  const trimmedName = name.trim()
  const canSubmit = trimmedName && birthdate
  const preview = PREVIEW_INSIGHTS[previewIdx]

  return (
    <div className="cosmic-onboarding cosmic-onboarding--hero">
      {/* ── Brand ── */}
      <div className="cosmic-onboarding-brand">
        <JupiterIcon size={36} />
        <span className="cosmic-onboarding-brand-name">AstroDig</span>
        <span className="cosmic-onboarding-brand-by">by Jupiter Digital</span>
      </div>

      {/* ── Campaign greeting (UAC program ad arrivals) ── */}
      {campaign === 'uac2026' && (
        <p className="onboarding-campaign-ribbon">
          ✦ Welcome, UAC attendees. Tap a finished chart below to see a whole family mapped at once.
        </p>
      )}

      {/* ── Headline ── */}
      <h2>Your group's cosmic story starts&nbsp;here</h2>
      <p className="cosmic-onboarding-tagline">
        See the sun signs, moon signs, and planets across your family, friends, or crew, all in one&nbsp;chart.
      </p>
      <p className="cosmic-onboarding-credo">Awareness, not destiny.</p>

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
          <div
            className={`onboarding-mini-node onboarding-mini-node--bc${sun ? ' onboarding-mini-node--lit' : ''}`}
            style={{ '--el': el?.color ?? '#5bc8f5' }}
          >
            <span className="onboarding-mini-glyph">{sun ? sun.symbol : '♊'}</span>
            <span className="onboarding-mini-name">{sun && trimmedName ? trimmedName.split(' ')[0] : 'You'}</span>
          </div>
        </div>

        {/* Mini insight card — rotates examples while idle, then personalizes */}
        {sun ? (
          <div className="onboarding-mini-insight onboarding-mini-insight--you">
            <span className="onboarding-mini-insight-heading">Your Sign</span>
            <span className="onboarding-mini-insight-body">
              <strong style={{ color: el.color }}>{sun.symbol} {sun.sign}</strong>. {el.element} energy.
              Add everyone to see what you share.
            </span>
          </div>
        ) : engaged ? (
          <div className="onboarding-mini-insight onboarding-mini-insight--cycle">
            <span className="onboarding-mini-insight-heading">Your Sign</span>
            <span className="onboarding-mini-insight-body">Finish adding your birthday and your sign appears here ✦</span>
          </div>
        ) : (
          <div className={`onboarding-mini-insight${previewIdx > 0 ? ' onboarding-mini-insight--cycle' : ''}`} key={previewIdx}>
            <span className="onboarding-mini-insight-heading">{preview.heading} <em className="onboarding-mini-insight-tag">example</em></span>
            <span className="onboarding-mini-insight-body">{preview.body}</span>
          </div>
        )}
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
      <div className="cosmic-onboarding-divider"><span>or explore a finished chart</span></div>

      {/* ── Demo links ── */}
      <div className="cosmic-onboarding-demos cosmic-onboarding-demos--primary">
        <button type="button" className="cosmic-onboarding-demo-primary" onClick={() => { tookAction.current = true; onDemo() }}>
          <span className="onboarding-demo-title">The Andersons</span>
          <span className="onboarding-demo-sub">family of 9</span>
        </button>
        <button type="button" className="cosmic-onboarding-demo-primary" onClick={() => { tookAction.current = true; onDemoCrew() }}>
          <span className="onboarding-demo-title">The Crew</span>
          <span className="onboarding-demo-sub">friends & coworkers</span>
        </button>
      </div>

      {/* ── What is AstroDig? ── */}
      <button
        type="button"
        className="onboarding-whatis-toggle"
        aria-expanded={showWhatIs}
        onClick={() => setShowWhatIs(v => !v)}
      >
        What is AstroDig? {showWhatIs ? '▴' : '▾'}
      </button>
      {showWhatIs && (
        <div className="onboarding-whatis">
          <div className="onboarding-whatis-step">
            <span className="onboarding-whatis-num">1</span>
            <span>Add everyone. Names and birthdays are all it takes.</span>
          </div>
          <div className="onboarding-whatis-step">
            <span className="onboarding-whatis-num">2</span>
            <span>We map their sky: sun, moon, and planets for each person</span>
          </div>
          <div className="onboarding-whatis-step">
            <span className="onboarding-whatis-num">3</span>
            <span>Discover the patterns you share, and the story to pass on</span>
          </div>
          <p className="onboarding-whatis-by">From the astrologer behind Jupiter Digital.</p>
        </div>
      )}

      <MoonTonight />
    </div>
  )
}
