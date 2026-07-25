'use client'

import { useState }    from 'react'
import HourEntry       from './HourEntry.jsx'
import HourQuestions   from './HourQuestions.jsx'
import HourResult      from './HourResult.jsx'
import { apiUrl }      from '../../utils/apiBase.js'
import { logEvent }    from '../../utils/cloudStorage.js'

export default function HourPage() {
  const [phase,      setPhase]      = useState('entry') // 'entry' | 'preparing' | 'questions' | 'scoring' | 'result'
  const [person,     setPerson]     = useState(null)    // { birthdate, place, timeKnowledge }
  const [prep,       setPrep]       = useState(null)    // prepare payload (bins, segments, questions)
  const [submission, setSubmission] = useState(null)    // { answers, events } last scored
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState(null)

  async function handleEntry(personData) {
    setPerson(personData)
    setError(null)
    setPhase('preparing')
    logEvent('hour_start')

    try {
      const res = await fetch(apiUrl('/api/hour'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ step: 'prepare', ...personData }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? data.error ?? 'Something went wrong')
      setPrep(data)
      setPhase('questions')
    } catch (err) {
      setError(err.message)
      setPhase('entry')
    }
  }

  async function handleAnswers({ answers, events }) {
    setSubmission({ answers, events })
    setPhase('scoring')
    try {
      const res = await fetch(apiUrl('/api/hour'), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          step:      'score',
          birthdate: person.birthdate,
          binsMeta:  prep.binsMeta,
          ascLon:    prep.ascLon,
          mcLon:     prep.mcLon,
          moonLon:   prep.moonLon,
          answers,
          events,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setResult(data)
      setPhase('result')
      logEvent('hour_result')
    } catch (err) {
      setError(err.message)
      setPhase('questions')
    }
  }

  function handleRescore(answers) {
    logEvent('hour_revise')
    return handleAnswers({ answers, events: submission?.events ?? [] })
  }

  function handleReset() {
    setPhase('entry')
    setPerson(null)
    setPrep(null)
    setSubmission(null)
    setResult(null)
    setError(null)
  }

  return (
    <div className="hour-page">
      {phase === 'entry' && (
        <HourEntry onSubmit={handleEntry} error={error} />
      )}

      {(phase === 'preparing' || phase === 'scoring') && (
        <div className="hour-loading">
          <div className="hour-loading-ring" />
          <p className="hour-loading-text">
            {phase === 'preparing' ? 'Sweeping the sky across your window…' : 'Weighing your answers…'}
          </p>
        </div>
      )}

      {phase === 'questions' && (
        <HourQuestions prep={prep} error={error} onComplete={handleAnswers} onReset={handleReset} />
      )}

      {phase === 'result' && (
        <HourResult
          result={result}
          person={person}
          prep={prep}
          submission={submission}
          onRescore={handleRescore}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
