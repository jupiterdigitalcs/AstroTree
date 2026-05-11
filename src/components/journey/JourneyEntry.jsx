'use client'

import { useState } from 'react'

export default function JourneyEntry({ onSubmit, error }) {
  const [name,      setName]      = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [showTime,  setShowTime]  = useState(false)
  const [birthTime, setBirthTime] = useState('')
  const [loading,   setLoading]   = useState(false)

  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!birthdate || loading) return
    setLoading(true)

    // Auto-detect timezone from browser
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    await onSubmit({
      name:          name.trim() || null,
      birthdate,
      birthTime:     showTime && birthTime ? birthTime : null,
      birthTimezone: showTime && birthTime ? tz        : null,
    })

    setLoading(false)
  }

  return (
    <div className="journey-entry-wrap">
      <form className="journey-entry" onSubmit={handleSubmit}>

        <div className="journey-entry-star">✦</div>
        <div className="journey-beta-header">
          <h1 className="journey-entry-title">Your Journey</h1>
          <span className="journey-beta-badge">BETA</span>
        </div>
        <p className="journey-entry-sub">
          The major chapters of your life, written in the sky.
        </p>
        <p className="journey-beta-notice">
          Early preview — results aren't saved and features are still evolving.
        </p>

        {error && (
          <p style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <div className="journey-form-fields">

          <div className="journey-field">
            <label className="journey-label">Your name (optional)</label>
            <input
              className="journey-input"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="given-name"
            />
          </div>

          <div className="journey-field">
            <label className="journey-label">Birthdate</label>
            <input
              className="journey-input"
              type="date"
              required
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              max={today}
              min="1900-01-01"
            />
          </div>

          <button
            type="button"
            className="journey-time-toggle"
            onClick={() => setShowTime(v => !v)}
          >
            {showTime ? '− Hide birth time' : '+ Add birth time for Moon chapters'}
          </button>

          {showTime && (
            <div className="journey-field">
              <label className="journey-label">Birth time</label>
              <input
                className="journey-input"
                type="time"
                value={birthTime}
                onChange={e => setBirthTime(e.target.value)}
              />
              <p className="journey-field-hint">
                Your timezone is detected automatically from your browser.
              </p>
            </div>
          )}
        </div>

        <button
          className="journey-submit"
          type="submit"
          disabled={!birthdate || loading}
        >
          {loading ? 'Calculating your chapters…' : 'See My Journey'}
        </button>

      </form>
    </div>
  )
}
