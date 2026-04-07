export default function DigProgressBar({ total, current }) {
  return (
    <div className="dig-progress">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="dig-progress-seg">
          <div
            className="dig-progress-fill"
            style={{ width: i < current ? '100%' : i === current ? '100%' : '0%' }}
          />
        </div>
      ))}
    </div>
  )
}
