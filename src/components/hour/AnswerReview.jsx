'use client'

import { useState } from 'react'
import { RISING_FIRST_IMPRESSIONS, MOON_STYLES, RISING_FIT_OPTIONS } from '../../utils/hourQuestions.js'
import { getElement } from '../../utils/astrology/elements.js'

/** Explains the sun-sign leakage discount, when one applied */
function leakageNote(risingSign, sunSign) {
  if (!sunSign || risingSign === undefined) return null
  if (risingSign === sunSign) {
    return `Your Sun is in ${sunSign} too, so this description would likely fit you at any birth time. We weighed this answer gently.`
  }
  if (getElement(risingSign).element === getElement(sunSign).element) {
    return `This sign shares its element with your ${sunSign} Sun, so we weighed this answer a little gently.`
  }
  return null
}

/** '13:40' as minutes → '1:40 PM' */
function minuteTo12h(minute) {
  const m = Math.max(0, Math.min(1439, Math.round(minute)))
  const h = Math.floor(m / 60)
  const period = h < 12 ? 'AM' : 'PM'
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${period}`
}

/** Time ranges a sign occupies in the window, e.g. "2:10 PM to 4:40 PM" */
function rangesForSign(segments, sign) {
  return (segments ?? [])
    .filter(s => s.sign === sign)
    .map(s => `${minuteTo12h(s.startMinute)} to ${minuteTo12h(s.endMinute)}`)
    .join(' and ')
}

const RISING_EFFECT = {
  yes:      'made these times more likely',
  somewhat: 'gently favored these times',
  no:       'made these times less likely',
  skip:     'left these times unchanged',
}

export default function AnswerReview({ prep, submission, onRescore }) {
  const [edited, setEdited] = useState(submission.answers)
  const changed = JSON.stringify(edited) !== JSON.stringify(submission.answers)

  function updateAnswer(index, patch) {
    setEdited(prev => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  return (
    <div className="hour-review">
      <p className="hour-review-intro">
        Here is what each answer did, with the sign behind each description revealed.
        Change anything that reads wrong and we recalculate.
      </p>

      {edited.map((answer, i) => {
        if (answer.kind === 'risingFit') {
          const ranges = rangesForSign(prep.segments, answer.sign)
          const note = leakageNote(answer.sign, prep.sunSign)
          return (
            <div key={`${answer.kind}-${answer.sign}`} className="hour-review-item">
              <p className="hour-review-copy">{RISING_FIRST_IMPRESSIONS[answer.sign]}</p>
              <p className="hour-review-effect">
                This was {answer.sign} rising ({ranges}). Your answer {RISING_EFFECT[answer.response]}.
                {note ? ` ${note}` : ''}
              </p>
              <div className="hour-review-choices">
                {RISING_FIT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={`hour-review-choice ${answer.response === o.value ? 'is-active' : ''}`}
                    onClick={() => updateAnswer(i, { response: o.value })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )
        }

        if (answer.kind === 'moon') {
          const boundary = prep.moonBoundary
          if (!boundary) return null
          const boundaryLabel = minuteTo12h(boundary.boundaryMinute)
          const sideLabel = {
            before: `leaned your window toward times before ${boundaryLabel}`,
            after:  `leaned your window toward times after ${boundaryLabel}`,
            skip:   'left the window unchanged',
          }
          return (
            <div key="moon" className="hour-review-item">
              <p className="hour-review-effect">
                The Moon moved from {boundary.beforeSign} to {boundary.afterSign} at {boundaryLabel} that day.
                Your pick {sideLabel[answer.side]}.
              </p>
              <div className="hour-review-choices">
                <button
                  type="button"
                  className={`hour-review-choice ${answer.side === 'before' ? 'is-active' : ''}`}
                  onClick={() => updateAnswer(i, { side: 'before' })}
                >
                  {boundary.beforeSign} Moon: {MOON_STYLES[boundary.beforeSign]}
                </button>
                <button
                  type="button"
                  className={`hour-review-choice ${answer.side === 'after' ? 'is-active' : ''}`}
                  onClick={() => updateAnswer(i, { side: 'after' })}
                >
                  {boundary.afterSign} Moon: {MOON_STYLES[boundary.afterSign]}
                </button>
                <button
                  type="button"
                  className={`hour-review-choice ${answer.side === 'skip' ? 'is-active' : ''}`}
                  onClick={() => updateAnswer(i, { side: 'skip' })}
                >
                  Not sure
                </button>
              </div>
            </div>
          )
        }

        return null
      })}

      {submission.events?.length > 0 && (
        <p className="hour-review-events-note">
          Your {submission.events.length === 1 ? 'turning point stays' : 'turning points stay'} in
          the calculation either way. The sky weighs those, not us.
        </p>
      )}

      <button
        type="button"
        className="hour-submit"
        disabled={!changed}
        onClick={() => onRescore(edited)}
      >
        Recalculate
      </button>
    </div>
  )
}
