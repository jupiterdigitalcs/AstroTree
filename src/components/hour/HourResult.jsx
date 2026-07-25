'use client'

import { useState } from 'react'
import AnswerReview from './AnswerReview.jsx'

const TIER_COPY = {
  strong: 'Your answers pointed in one clear direction. We would call this a confident window, though only a birth record can settle it for good.',
  moderate: 'The picture narrowed nicely. Treat this as a strong lead rather than a settled fact.',
  light: 'The sky did not give us much to grab onto this time. Treat this as a starting range, and if a birth record ever surfaces, trust it over this.',
}

const TIER_LABEL = { strong: 'Confident', moderate: 'Promising', light: 'A starting point' }

/** '14:05' → '2:05 PM' */
function to12h(label) {
  const [h, m] = label.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`
}

function shareInTen(share) {
  return Math.max(1, Math.min(9, Math.round(share * 10)))
}

export default function HourResult({ result, person, prep, submission, onRescore, onReset }) {
  const [reviewing, setReviewing] = useState(false)
  const { window, risingCandidates, tier, originalMinutes, eventsUsed } = result
  const canReview = submission?.answers?.length > 0
  const windowMinutes = window.endMinute - window.startMinute
  const top    = risingCandidates[0]
  const second = risingCandidates[1]
  const narrowed = originalMinutes - windowMinutes

  return (
    <div className="hour-result-wrap">
      <div className="hour-result">

        <div className="hour-entry-star">✦</div>
        <p className="hour-result-kicker">{TIER_LABEL[tier] ?? 'Your window'}</p>

        <h2 className="hour-result-window">
          {to12h(window.startLabel)} <span className="hour-result-to">to</span> {to12h(window.endLabel)}
        </h2>
        <p className="hour-result-sub">
          Our best estimate for your birth time on {person.birthdate}, born in {person.place.name}.
        </p>

        {prep?.singleSign ? (
          <div className="hour-result-rising">
            <p className="hour-result-rising-main">
              <span className="hour-result-symbol">{top?.symbol}</span>
              Rising sign: <strong>{prep.singleSign}</strong>
            </p>
            <p className="hour-result-rising-note">
              Every minute of your window rises under {prep.singleSign}, so this one is settled
              regardless of the exact time.
            </p>
          </div>
        ) : top && (
          <div className="hour-result-rising">
            <p className="hour-result-rising-main">
              <span className="hour-result-symbol">{top.symbol}</span>
              Most likely rising sign: <strong>{top.sign}</strong>
              <span className="hour-result-odds"> (about {shareInTen(top.share)} in 10)</span>
            </p>
            {second && second.share >= 0.15 && (
              <p className="hour-result-rising-note">
                {second.sign} rising is still in the running at about {shareInTen(second.share)} in 10.
              </p>
            )}
          </div>
        )}

        <p className="hour-result-tier">{TIER_COPY[tier]}</p>

        {narrowed > 0 && (
          <p className="hour-result-narrowed">
            Together we narrowed a {Math.round(originalMinutes / 60 * 10) / 10} hour window down
            to about {windowMinutes >= 90 ? `${Math.round(windowMinutes / 60 * 10) / 10} hours` : `${windowMinutes} minutes`}
            {eventsUsed > 0 ? `, helped along by ${eventsUsed === 1 ? 'the turning point you shared' : 'the turning points you shared'}.` : '.'}
          </p>
        )}

        {canReview && (
          <button
            type="button"
            className="hour-review-toggle"
            onClick={() => setReviewing(v => !v)}
          >
            {reviewing ? 'Hide the breakdown' : 'Doesn’t feel right? See what your answers did'}
          </button>
        )}

        {reviewing && (
          <AnswerReview prep={prep} submission={submission} onRescore={onRescore} />
        )}

        <div className="hour-result-nudge">
          <p>
            Curious what this changes? Enter this time for yourself in AstroDig and see how your
            chart sits alongside the people in your life.
          </p>
          <a className="hour-result-cta" href="/">Open AstroDig</a>
        </div>

        <p className="hour-result-caveat">
          A note on honesty: no quiz can pin a birth time to the minute. If a birth certificate,
          hospital record, or a relative's memory ever offers a real time, that wins.
        </p>

        <button type="button" className="hour-questions-reset" onClick={onReset}>
          Start over
        </button>

        <p className="hour-attribution">Place data from GeoNames.org</p>
      </div>
    </div>
  )
}
