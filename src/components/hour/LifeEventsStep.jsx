'use client'

import { useState } from 'react'

const EVENT_TYPES = [
  { value: 'career',    label: 'Career change' },
  { value: 'move',      label: 'Big move' },
  { value: 'marriage',  label: 'Marriage or commitment' },
  { value: 'loss',      label: 'A significant loss' },
  { value: 'health',    label: 'Health turning point' },
  { value: 'beginning', label: 'A big beginning' },
]

const EMPTY = { date: '', type: 'career' }

export default function LifeEventsStep({ onDone }) {
  const [events, setEvents] = useState([{ ...EMPTY }])

  function update(index, field, value) {
    setEvents(prev => prev.map((ev, i) => (i === index ? { ...ev, [field]: value } : ev)))
  }

  function addRow() {
    setEvents(prev => (prev.length < 3 ? [...prev, { ...EMPTY }] : prev))
  }

  function handleContinue() {
    onDone(events.filter(ev => /^\d{4}-\d{2}$/.test(ev.date)).map(ev => ({ date: ev.date, type: ev.type })))
  }

  return (
    <div className="hour-events">
      <p className="hour-events-hint">
        Times when life clearly turned a corner can help pin down the clock.
        A month and a year is enough, and rough guesses are fine.
      </p>

      {events.map((ev, i) => (
        <div key={i} className="hour-event-row">
          <select
            className="hour-input"
            value={ev.type}
            onChange={e => update(i, 'type', e.target.value)}
            aria-label="What kind of turning point"
          >
            {EVENT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input
            className="hour-input"
            type="month"
            value={ev.date}
            onChange={e => update(i, 'date', e.target.value)}
            min="1900-01"
            aria-label="When it happened"
          />
        </div>
      ))}

      {events.length < 3 && (
        <button type="button" className="hour-events-add" onClick={addRow}>
          + Add another
        </button>
      )}

      <div className="hour-question-actions">
        <button type="button" className="hour-submit" onClick={handleContinue}>
          See My Window
        </button>
        <button type="button" className="hour-skip" onClick={() => onDone([])}>
          Skip this
        </button>
      </div>
    </div>
  )
}
