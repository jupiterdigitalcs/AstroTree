import { getMoodLabel, getPhaseLabel } from './currentData'

export default function MoodGauge({ mood }) {
  if (!mood || mood.total === 0) return null

  const easePct    = Math.round((mood.expansion / mood.total) * 100)
  const moodLabel  = getMoodLabel(mood)
  const phaseLabel = getPhaseLabel(mood)

  // Aurora backdrop driven by the actual reading: ease leans calm teal-gold
  // and drifts slowly, intensity leans violet-crimson and moves faster
  const auroraHue = Math.round(330 - easePct * 1.8)
  const auroraStyle = {
    '--aurora-h': auroraHue,
    '--aurora-speed': `${9 + easePct * 0.09}s`,
    '--aurora-opacity': (0.26 + (100 - easePct) * 0.0022).toFixed(3),
  }

  return (
    <div className="current-card current-mood" role="region" aria-label="Group mood" style={auroraStyle}>
      <div className="current-mood-aurora" aria-hidden="true" />
      <h4 className="current-card-heading">The Mood</h4>
      <p className="current-card-whisper">
        Some transits open doors. Others test and transform. This is the
        balance your group is sitting in right now.
      </p>

      <div className="current-mood-bar">
        <span className="current-mood-label-left">◂ Intensity</span>
        <div
          className="current-mood-track"
          role="meter"
          aria-valuenow={easePct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${easePct}% ease, ${100 - easePct}% intensity`}
        >
          <div className="current-mood-ticks">
            <span className="current-mood-tick" />
            <span className="current-mood-tick" />
            <span className="current-mood-tick" />
          </div>
          <span className="current-mood-center" />
          <span
            className="current-mood-indicator"
            style={{ left: `${easePct}%` }}
          />
        </div>
        <span className="current-mood-label-right">Ease ▸</span>
      </div>

      <p className="current-mood-summary">{moodLabel}</p>
      {phaseLabel && <p className="current-card-whisper">{phaseLabel}</p>}
      {mood.retrograde > 0 && (
        <p className="current-card-whisper">
          {mood.retrograde} of {mood.total} transit{mood.total !== 1 ? 's' : ''} involve
          retrograde planets. This can show up as review, revision, and revisiting old ground.
        </p>
      )}
    </div>
  )
}
