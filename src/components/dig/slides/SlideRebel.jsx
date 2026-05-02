export default function SlideRebel({ data }) {
  const { node, airCount } = data
  const d = node.data

  return (
    <div className="dig-slide-content dig-sparkles">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The Free Thinker</p>
      <div className="dig-scale-pop dig-glow" style={{ '--i': 0, color: '#5bc8f5' }}>
        <span className="dig-stat" style={{ color: '#5bc8f5' }}>{d.symbol}</span>
      </div>
      <h2 className="dig-headline dig-fly-in" style={{ '--i': 1 }}>
        {d.name}
      </h2>
      <p className="dig-body dig-fly-in" style={{ '--i': 2, color: '#5bc8f5', fontWeight: 500, fontSize: '1rem' }}>
        The Most Air Energy Here
      </p>
      <div className="dig-divider dig-fly-in" style={{ '--i': 3 }} />
      <p className="dig-body dig-fade-in" style={{ '--i': 3 }}>
        {airCount} Air placement{airCount > 1 ? 's' : ''} — {d.name.split(' ')[0]} tends to lead with
        ideas, questions, and perspective. The one who steps back to see the bigger picture.
      </p>
      <p className="dig-body dig-fade-in" style={{ '--i': 4, fontSize: '0.75rem', opacity: 0.5, marginTop: '0.6rem' }}>
        Every group needs someone who thinks differently
      </p>
    </div>
  )
}
