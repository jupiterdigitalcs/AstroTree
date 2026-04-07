export default function SlideEmotionalForecast({ data }) {
  const { node, moonVibe, waterCount } = data
  const d = node.data

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>Emotional Forecast</p>
      <div className="dig-scale-pop" style={{ '--i': 0 }}>
        <span className="dig-stat">🌊</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#5b8fd4', fontWeight: 500, fontSize: '1rem' }}>
        The Family Empath
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        With a {d.moonSign} Moon, {d.name.split(' ')[0]} {moonVibe}.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.78rem', opacity: 0.5, marginTop: '0.6rem' }}>
        {waterCount} water placements — this one feels everything
      </p>
    </div>
  )
}
