'use client'

import { useState }   from 'react'
import LifeEventsStep from './LifeEventsStep.jsx'

export default function HourQuestions({ prep, error, onComplete, onReset }) {
  const [step,    setStep]    = useState(0)
  const [answers, setAnswers] = useState([])

  const questions = prep?.questions ?? []
  const question  = questions[step]

  function advance(nextAnswers) {
    if (step + 1 < questions.length) {
      setAnswers(nextAnswers)
      setStep(step + 1)
    } else {
      onComplete({ answers: nextAnswers, events: [] })
    }
  }

  function answerRising(response) {
    advance([...answers, { kind: 'risingFit', sign: question.sign, response }])
  }

  function answerMoon(side) {
    advance([...answers, { kind: 'moon', boundaryMinute: question.boundaryMinute, side }])
  }

  function finishWithEvents(events) {
    onComplete({ answers, events })
  }

  if (!question) return null

  return (
    <div className="hour-questions-wrap">
      <div className="hour-questions">

        <div className="hour-progress" aria-label={`Question ${step + 1} of ${questions.length}`}>
          {questions.map((q, i) => (
            <span key={q.id} className={`hour-progress-dot ${i <= step ? 'is-done' : ''}`} />
          ))}
        </div>

        {prep?.singleSign && step === 0 && (
          <p className="hour-single-sign-note">
            Good news: every minute of your window rises under {prep.singleSign}. Your rising sign
            is settled. The questions ahead narrow the time within it.
          </p>
        )}

        {error && <p className="hour-error">{error}</p>}

        <h2 className="hour-question-prompt">{question.prompt}</h2>

        {question.kind === 'risingFit' && (
          <>
            {/* Deliberately blind: no sign name or glyph, so the description
                is judged on its own rather than on zodiac reputation */}
            <blockquote className="hour-question-copy">
              {question.copy}
            </blockquote>
            <div className="hour-question-options">
              {question.options.map(o => (
                <button
                  key={o.value}
                  type="button"
                  className="hour-option-btn"
                  onClick={() => answerRising(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {question.kind === 'moon' && (
          <div className="hour-question-options">
            {question.options.map(o => (
              <button
                key={o.value}
                type="button"
                className={o.value === 'skip' ? 'hour-option-btn hour-option-btn--skip' : 'hour-option-btn hour-option-btn--moon'}
                onClick={() => answerMoon(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {question.kind === 'events' && (
          <LifeEventsStep onDone={finishWithEvents} />
        )}

        <button type="button" className="hour-questions-reset" onClick={onReset}>
          Start over
        </button>
      </div>
    </div>
  )
}
