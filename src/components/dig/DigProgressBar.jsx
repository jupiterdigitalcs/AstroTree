export default function DigProgressBar({ total, current, freeLimit = 0 }) {
  return (
    <div className="dig-progress">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`dig-progress-seg${freeLimit > 0 && i >= freeLimit ? ' dig-progress-seg--locked' : ''}`}>
          <div
            className="dig-progress-fill"
            style={{ width: i < current ? '100%' : i === current ? '100%' : '0%' }}
          />
        </div>
      ))}
      {freeLimit > 0 && (
        <span className="dig-progress-free-label">{freeLimit} free</span>
      )}
    </div>
  )
}
