'use client'

import { useState } from 'react'
import CitySearch   from './CitySearch.jsx'

const UNCERTAINTY_OPTIONS = [
  { value: 15,  label: 'Within 15 minutes' },
  { value: 30,  label: 'Within 30 minutes' },
  { value: 60,  label: 'Within an hour' },
  { value: 120, label: 'Within 2 hours' },
]

const PART_OPTIONS = [
  { value: 'morning',   label: 'Morning',   range: '6 AM to noon' },
  { value: 'afternoon', label: 'Afternoon', range: 'Noon to 6 PM' },
  { value: 'evening',   label: 'Evening',   range: '6 PM to midnight' },
  { value: 'night',     label: 'Overnight', range: 'Midnight to 6 AM' },
  { value: 'unknown',   label: 'Not sure',  range: 'We start from the full day' },
]

export default function HourEntry({ onSubmit, error }) {
  const [birthdate,   setBirthdate]   = useState('')
  const [place,       setPlace]       = useState(null)
  const [part,        setPart]        = useState('unknown')
  const [showTime,    setShowTime]    = useState(false)
  const [time,        setTime]        = useState('')
  const [uncertainty, setUncertainty] = useState(60)
  const [loading,     setLoading]     = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const hasExactTime = showTime && !!time
  const ready = birthdate && place

  async function handleSubmit(e) {
    e.preventDefault()
    if (!ready || loading) return
    setLoading(true)

    const timeKnowledge =
      hasExactTime        ? { kind: 'exact', time, uncertaintyMinutes: uncertainty } :
      part !== 'unknown'  ? { kind: 'partOfDay', part } :
                            { kind: 'unknown' }

    await onSubmit({ birthdate, place, timeKnowledge })
    setLoading(false)
  }

  return (
    <div className="hour-entry-wrap">
      <form className="hour-entry" onSubmit={handleSubmit}>

        <div className="hour-entry-star">✦</div>
        <div className="hour-beta-header">
          <h1 className="hour-entry-title">The Hour</h1>
          <span className="hour-beta-badge">BETA</span>
        </div>
        <p className="hour-entry-sub">
          Not sure when you were born? Start with what you know and we narrow it down together.
        </p>
        <p className="hour-beta-notice">
          Early preview. Results are a best estimate, not a certificate, and they are not saved.
        </p>

        {error && <p className="hour-error">{error}</p>}

        <div className="hour-form-fields">

          <div className="hour-field">
            <label className="hour-label">Birthdate</label>
            <input
              className="hour-input"
              type="date"
              required
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              max={today}
              min="1900-01-01"
            />
          </div>

          <div className="hour-field">
            <label className="hour-label">Birthplace</label>
            <CitySearch value={place} onSelect={setPlace} />
            <p className="hour-field-hint">
              The rising sign depends on where the horizon was, so the city matters.
            </p>
          </div>

          <div className="hour-field">
            <label className="hour-label">What time were you born? Pick the closest window.</label>
            <div className="hour-part-grid">
              {PART_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className={`hour-part-btn ${part === o.value && !hasExactTime ? 'is-active' : ''}`}
                  onClick={() => setPart(o.value)}
                >
                  <span className="hour-part-label">{o.label}</span>
                  <span className="hour-part-range">{o.range}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="hour-time-toggle"
            onClick={() => setShowTime(v => !v)}
          >
            {showTime ? '− Never mind, just the window' : '+ I have a rough time'}
          </button>

          {showTime && (
            <div className="hour-field hour-field-row">
              <div>
                <label className="hour-label">Around what time?</label>
                <input
                  className="hour-input"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
              <div>
                <label className="hour-label">How sure?</label>
                <select
                  className="hour-input"
                  value={uncertainty}
                  onChange={e => setUncertainty(Number(e.target.value))}
                >
                  {UNCERTAINTY_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {hasExactTime && (
            <p className="hour-field-hint">
              We use this time instead of the window above.
            </p>
          )}
        </div>

        <button className="hour-submit" type="submit" disabled={!ready || loading}>
          {loading ? 'Reading the horizon…' : 'Narrow It Down'}
        </button>

        <p className="hour-attribution">Place data from GeoNames.org</p>
      </form>
    </div>
  )
}
