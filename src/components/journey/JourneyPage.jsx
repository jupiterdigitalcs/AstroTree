'use client'

import { useState }     from 'react'
import JourneyEntry     from './JourneyEntry.jsx'
import TransitRiver     from './TransitRiver.jsx'
import { apiUrl } from '../../utils/apiBase.js'

export default function JourneyPage() {
  const [phase,       setPhase]       = useState('entry') // 'entry' | 'loading' | 'river'
  const [events,      setEvents]      = useState([])
  const [hasBirthTime, setHasBirthTime] = useState(false)
  const [person,      setPerson]      = useState(null)
  const [error,       setError]       = useState(null)

  async function handleSubmit(personData) {
    setPerson(personData)
    setError(null)
    setPhase('loading')

    try {
      const res = await fetch(apiUrl('/api/journey'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          birthdate:     personData.birthdate,
          birthTime:     personData.birthTime     ?? null,
          birthTimezone: personData.birthTimezone ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setEvents(data.events ?? [])
      setHasBirthTime(data.hasBirthTime ?? false)
      setPhase('river')
    } catch (err) {
      setError(err.message)
      setPhase('entry')
    }
  }

  function handleReset() {
    setPhase('entry')
    setEvents([])
    setPerson(null)
    setError(null)
  }

  return (
    <div className="journey-page">
      {phase === 'entry' && (
        <JourneyEntry onSubmit={handleSubmit} error={error} />
      )}

      {phase === 'loading' && (
        <div className="journey-loading">
          <div className="journey-loading-ring" />
          <p className="journey-loading-text">Reading your sky…</p>
          <p className="journey-loading-sub">This takes about 15 seconds</p>
        </div>
      )}

      {phase === 'river' && (
        <TransitRiver
          events={events}
          person={person}
          hasBirthTime={hasBirthTime}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
