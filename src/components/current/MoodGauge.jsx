import { getMoodLabel, getPhaseLabel } from './currentData'

export default function MoodGauge({ mood }) {
  if (!mood || mood.total === 0) return null

  const expansionPct = Math.round((mood.expansion / mood.total) * 100)
  const pressurePct  = 100 - expansionPct
  const moodLabel    = getMoodLabel(mood)
  const phaseLabel   = getPhaseLabel(mood)

  return (
    <div className="current-card current-mood">
      <h4 className="current-card-heading">The Mood</h4>
      <div className="current-mood-bar">
        <span className="current-mood-label-left">♃ Growth</span>
        <div className="current-mood-track">
          <div
            className="current-mood-fill current-mood-fill--expansion"
            style={{ width: `${expansionPct}%` }}
          />
          <div
            className="current-mood-fill current-mood-fill--pressure"
            style={{ width: `${pressurePct}%` }}
          />
        </div>
        <span className="current-mood-label-right">♄♅♆♇</span>
      </div>
      <p className="current-card-note">{moodLabel}</p>
      {phaseLabel && <p className="current-card-whisper">{phaseLabel}</p>}
      {mood.retrograde > 0 && (
        <p className="current-card-whisper">
          {mood.retrograde} of {mood.total} transit{mood.total !== 1 ? 's' : ''} involve
          retrograde planets — review and revision energy
        </p>
      )}
    </div>
  )
}
